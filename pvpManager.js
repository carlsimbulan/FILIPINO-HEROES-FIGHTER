// pvpManager.js — PVP session management for Filipino Heroes Fighter
// All socket.io event handling and in-memory session state lives here.

const { randomUUID } = require('crypto');

/** Valid hero IDs accepted by the server */
const VALID_HEROES = ['lapulapu', 'pacquiao', 'antonioluna', 'urduja', 'sultankudarat', 'luces'];

/**
 * Find any active (non-done) session for a given username.
 * @param {Map} sessions
 * @param {string} username
 * @returns {import('./pvpManager').PVPSession|undefined}
 */
function findActiveSessionForUser(sessions, username) {
  for (const session of sessions.values()) {
    if (
      session.state !== 'done' &&
      (session.inviterUsername === username || session.inviteeUsername === username)
    ) {
      return session;
    }
  }
  return undefined;
}

/**
 * Clear all timers on a session safely.
 * @param {object} session
 */
function clearSessionTimers(session) {
  if (session.expiryTimer) {
    clearTimeout(session.expiryTimer);
    session.expiryTimer = null;
  }
  for (const username of Object.keys(session.disconnectTimers || {})) {
    if (session.disconnectTimers[username]) {
      clearTimeout(session.disconnectTimers[username]);
      session.disconnectTimers[username] = null;
    }
  }
}

/**
 * Initialise PVP socket handling on the given socket.io server instance.
 * @param {import('socket.io').Server} io
 * @param {() => import('mongodb').Db | undefined} getDb  – returns the live MongoDB db (or undefined if not yet connected)
 */
function initPVP(io, getDb) {
  // In-memory session store
  const sessions     = new Map(); // roomId → PVPSession
  const socketToUser = new Map(); // socketId → username
  const userToSocket = new Map(); // username → socketId
  const userFriends  = new Map(); // username → Set<friendUsername> (for presence notifications)

  // ── helpers ────────────────────────────────────────────────────────────────

  /** Remove session and clear all its timers. */
  function cleanupSession(roomId) {
    const session = sessions.get(roomId);
    if (!session) return;
    clearSessionTimers(session);
    sessions.delete(roomId);
  }

  /** Increment pvpwins + overallwins for the winner, pvplosses for the loser. */
  async function recordPVPWin(winnerUsername, loserUsername) {
    try {
      const db = getDb ? getDb() : undefined;
      if (!db) return;
      await db.collection('users').updateOne(
        { username: winnerUsername },
        { $inc: { pvpwins: 1, overallwins: 1 } }
      );
      await db.collection('leaderboards').updateOne(
        { username: winnerUsername },
        { $inc: { pvpwins: 1, overallwins: 1 } },
        { upsert: true }
      );
      if (loserUsername) {
        await db.collection('users').updateOne(
          { username: loserUsername },
          { $inc: { pvplosses: 1 } }
        );
        await db.collection('leaderboards').updateOne(
          { username: loserUsername },
          { $inc: { pvplosses: 1 } },
          { upsert: true }
        );
      }
    } catch (e) {
      console.error('[PVP] recordPVPWin error:', e.message);
    }
  }

  // ── connection handler ─────────────────────────────────────────────────────

  io.on('connection', (socket) => {

    // ── pvp:auth ─────────────────────────────────────────────────────────────
    // { username }
    // Associates this socket with a username. Handles re-auth on reconnect.
    socket.on('pvp:auth', ({ username } = {}) => {
      if (!username) return;

      // If this username was already mapped to an old socket, clean up the old entry
      const oldSocketId = userToSocket.get(username);
      if (oldSocketId && oldSocketId !== socket.id) {
        socketToUser.delete(oldSocketId);
      }

      socketToUser.set(socket.id, username);
      userToSocket.set(username, socket.id);

      // Join personal room for targeted delivery
      socket.join(`user:${username}`);

      console.log(`[PVP] auth: ${username} → ${socket.id}`);

      // Notify this user's friends that they came online
      // The client must send its friend list so we know who to notify
      socket.on('pvp:notify_presence', ({ friends } = {}) => {
        if (!Array.isArray(friends)) return;
        // Store this user's friend list for offline notification
        userFriends.set(username, new Set(friends));
        // Tell each online friend that this user is now online
        for (const friendUsername of friends) {
          if (userToSocket.has(friendUsername)) {
            io.to(`user:${friendUsername}`).emit('pvp:friend_came_online', { username });
          }
        }
        // Tell this user which of their friends are already online
        const onlineFriends = friends.filter(f => userToSocket.has(f));
        socket.emit('pvp:online_status', { online: onlineFriends });
      });
    });

    // ── pvp:check_online ──────────────────────────────────────────────────────
    // { usernames: string[] }
    // Returns which usernames from the provided list are currently connected.
    socket.on('pvp:check_online', ({ usernames } = {}) => {
      if (!Array.isArray(usernames)) return;
      const online = usernames.filter(u => userToSocket.has(u));
      socket.emit('pvp:online_status', { online });
    });

    // ── pvp:invite ────────────────────────────────────────────────────────────
    // { targetUsername }
    // Creates a PVPSession and notifies the target.
    socket.on('pvp:invite', ({ targetUsername } = {}) => {
      const senderUsername = socketToUser.get(socket.id);
      if (!senderUsername) {
        socket.emit('pvp:error', { reason: 'not_authenticated' });
        return;
      }

      // Block if sender already has an active session
      const existingSession = findActiveSessionForUser(sessions, senderUsername);
      if (existingSession) {
        socket.emit('pvp:error', { reason: 'already_in_session' });
        return;
      }

      // Block if target is not online
      if (!userToSocket.has(targetUsername)) {
        socket.emit('pvp:error', { reason: 'offline' });
        return;
      }

      // Also block if target is already in an active session — they will auto-decline
      const targetSession = findActiveSessionForUser(sessions, targetUsername);
      if (targetSession) {
        socket.emit('pvp:error', { reason: 'target_in_session' });
        return;
      }

      const roomId = randomUUID();

      // Look up inviter's ingamename for the invite payload (best-effort; may be undefined)
      const inviterIngamename = undefined; // resolved client-side; server doesn't store ingamenames

      /** @type {PVPSession} */
      const session = {
        roomId,
        inviterUsername:  senderUsername,
        inviteeUsername:  targetUsername,
        inviterSocketId:  socket.id,
        inviteeSocketId:  null,
        state:            'invited',
        heroChoices:      { [senderUsername]: null, [targetUsername]: null },
        disconnectTimers: { [senderUsername]: null, [targetUsername]: null },
        expiryTimer:      null,
      };

      sessions.set(roomId, session);

      // Emit invite to the target's personal room
      io.to(`user:${targetUsername}`).emit('pvp:invite', {
        roomId,
        inviterUsername:  senderUsername,
        inviterIngamename // may be undefined; client should fall back to username
      });

      console.log(`[PVP] invite: ${senderUsername} → ${targetUsername} (room ${roomId})`);

      // 30-second expiry timer
      session.expiryTimer = setTimeout(() => {
        const s = sessions.get(roomId);
        if (!s || s.state !== 'invited') return;

        sessions.delete(roomId);

        // Notify both sides
        socket.emit('pvp:expired', { roomId });
        io.to(`user:${targetUsername}`).emit('pvp:expired', { roomId });

        console.log(`[PVP] invite expired: room ${roomId}`);
      }, 30_000);
    });

    // ── pvp:accept ────────────────────────────────────────────────────────────
    // { roomId }
    socket.on('pvp:accept', ({ roomId } = {}) => {
      const session = sessions.get(roomId);
      if (!session || session.state !== 'invited') {
        socket.emit('pvp:error', { reason: 'invalid_session' });
        return;
      }

      const acceptingUsername = socketToUser.get(socket.id);
      if (acceptingUsername !== session.inviteeUsername) {
        socket.emit('pvp:error', { reason: 'not_invitee' });
        return;
      }

      // Clear expiry timer
      clearTimeout(session.expiryTimer);
      session.expiryTimer = null;

      // Update session
      session.inviteeSocketId = socket.id;
      session.state = 'lobby';

      // Join both sockets to the shared room
      const sharedRoom = `room:${roomId}`;
      socket.join(sharedRoom);

      const inviterSocket = io.sockets.sockets.get(session.inviterSocketId);
      if (inviterSocket) {
        inviterSocket.join(sharedRoom);
      }

      // Notify both players — include their positions in the same event
      if (inviterSocket) {
        inviterSocket.emit('pvp:accepted', {
          roomId,
          inviterUsername: session.inviterUsername,
          inviteeUsername: session.inviteeUsername,
          myPosition: 'p1'
        });
      }
      socket.emit('pvp:accepted', {
        roomId,
        inviterUsername: session.inviterUsername,
        inviteeUsername: session.inviteeUsername,
        myPosition: 'p2'
      });

      console.log(`[PVP] accepted: ${session.inviterUsername} vs ${session.inviteeUsername} (room ${roomId})`);
    });

    // ── pvp:decline ───────────────────────────────────────────────────────────
    // { roomId }
    socket.on('pvp:decline', ({ roomId } = {}) => {
      const session = sessions.get(roomId);
      if (!session) return;

      clearTimeout(session.expiryTimer);
      session.expiryTimer = null;
      sessions.delete(roomId);

      // Notify inviter
      io.to(`user:${session.inviterUsername}`).emit('pvp:declined', { roomId });

      console.log(`[PVP] declined: room ${roomId}`);
    });

    // ── pvp:cancel ────────────────────────────────────────────────────────────
    // { roomId }
    socket.on('pvp:cancel', ({ roomId } = {}) => {
      const session = sessions.get(roomId);
      if (!session) return;

      const senderUsername = socketToUser.get(socket.id);
      if (senderUsername !== session.inviterUsername) {
        socket.emit('pvp:error', { reason: 'not_inviter' });
        return;
      }

      clearTimeout(session.expiryTimer);
      session.expiryTimer = null;
      sessions.delete(roomId);

      // Notify the invitee
      io.to(`user:${session.inviteeUsername}`).emit('pvp:cancelled', { roomId });

      console.log(`[PVP] cancelled: room ${roomId}`);
    });

    // ── pvp:hero_chosen ───────────────────────────────────────────────────────
    // { roomId, heroId }
    socket.on('pvp:hero_chosen', ({ roomId, heroId } = {}) => {
      const session = sessions.get(roomId);
      if (!session || session.state !== 'lobby') {
        socket.emit('pvp:error', { reason: 'invalid_session' });
        return;
      }

      if (!VALID_HEROES.includes(heroId)) {
        socket.emit('pvp:error', { reason: 'invalid_hero', heroId });
        return;
      }

      const username = socketToUser.get(socket.id);
      if (
        username !== session.inviterUsername &&
        username !== session.inviteeUsername
      ) {
        socket.emit('pvp:error', { reason: 'not_in_session' });
        return;
      }

      session.heroChoices[username] = heroId;

      // Acknowledge to the whole room so the opponent UI can show "✓ Chosen"
      io.to(`room:${roomId}`).emit('pvp:hero_chosen_ack', { username });

      console.log(`[PVP] hero chosen: ${username} → ${heroId} (room ${roomId})`);

      // Check if both players have chosen
      const inviterChoice  = session.heroChoices[session.inviterUsername];
      const inviteeChoice  = session.heroChoices[session.inviteeUsername];

      if (inviterChoice && inviteeChoice) {
        session.state = 'fighting';

        io.to(`room:${roomId}`).emit('pvp:start_fight', {
          roomId,
          p1Hero:       inviterChoice,
          p2Hero:       inviteeChoice,
          p1Username:   session.inviterUsername,
          p2Username:   session.inviteeUsername,
        });

        console.log(`[PVP] start fight: ${session.inviterUsername}(${inviterChoice}) vs ${session.inviteeUsername}(${inviteeChoice})`);
      }
    });

    // ── pvp:input ─────────────────────────────────────────────────────────────
    // { roomId, snapshot }
    // Relay the sender's input snapshot to the other player in the room.
    // Use server-side session lookup so we don't trust client-provided roomId.
    socket.on('pvp:input', ({ roomId, snapshot } = {}) => {
      if (!snapshot) return;
      // Prefer server-authoritative roomId from session
      const username = socketToUser.get(socket.id);
      const session  = username ? findActiveSessionForUser(sessions, username) : null;
      const resolvedRoom = session ? `room:${session.roomId}` : (roomId ? `room:${roomId}` : null);
      if (!resolvedRoom) return;
      socket.to(resolvedRoom).emit('pvp:input', snapshot);
    });

    // ── pvp:fight_end ─────────────────────────────────────────────────────────
    // { roomId, winner }
    socket.on('pvp:fight_end', async ({ roomId, winner } = {}) => {
      const session = sessions.get(roomId);
      if (!session) return;

      // Idempotent — ignore if already done
      if (session.state === 'done') return;

      session.state = 'done';

      // Determine loser
      const loser = winner === session.inviterUsername
        ? session.inviteeUsername
        : session.inviterUsername;

      // Record the win and loss in MongoDB
      await recordPVPWin(winner, loser);

      // Notify both players in the room
      io.to(`room:${roomId}`).emit('pvp:fight_result', { winner });

      cleanupSession(roomId);

      console.log(`[PVP] fight end: winner=${winner} loser=${loser} (room ${roomId})`);
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const username = socketToUser.get(socket.id);
      if (!username) return;
      // Remove from tracking maps
      socketToUser.delete(socket.id);
      userToSocket.delete(username);

      console.log(`[PVP] disconnect: ${username} (${socket.id})`);

      // Notify friends that this user went offline
      const friendsOfUser = userFriends.get(username);
      if (friendsOfUser) {
        for (const friendUsername of friendsOfUser) {
          if (userToSocket.has(friendUsername)) {
            io.to(`user:${friendUsername}`).emit('pvp:friend_went_offline', { username });
          }
        }
        userFriends.delete(username);
      }

      console.log(`[PVP] disconnect: ${username} (${socket.id})`);

      // Find any active session for this user
      const session = findActiveSessionForUser(sessions, username);
      if (!session) return;

      const { roomId } = session;
      const sharedRoom = `room:${roomId}`;

      if (session.state === 'invited') {
        // Just clean up — no need to notify (the expiry timer will handle the other side,
        // or we can be proactive and notify immediately)
        const otherUsername =
          session.inviterUsername === username
            ? session.inviteeUsername
            : session.inviterUsername;

        io.to(`user:${otherUsername}`).emit('pvp:cancelled', { roomId, reason: 'disconnect' });
        cleanupSession(roomId);

      } else if (session.state === 'lobby') {
        io.to(sharedRoom).emit('pvp:opponent_disconnected', { username });
        cleanupSession(roomId);

      } else if (session.state === 'fighting') {
        // Give the disconnected player 10 seconds to reconnect
        const timer = setTimeout(() => {
          const s = sessions.get(roomId);
          if (!s || s.state === 'done') return;

          // Emit to whoever is still in the room
          io.to(sharedRoom).emit('pvp:opponent_left', { username });
          cleanupSession(roomId);

          console.log(`[PVP] reconnect window expired for ${username} (room ${roomId})`);
        }, 10_000);

        session.disconnectTimers[username] = timer;
      }
    });
  });
}

module.exports = { initPVP };
