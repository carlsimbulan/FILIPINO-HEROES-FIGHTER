// server.js — Filipino Heroes Fighter backend
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const { MongoClient } = require('mongodb');

const app  = express();
const PORT = 3000;

// ── MongoDB connection ─────────────────────────────────────
// Replace the connection string with your Atlas URI
// Get it from: MongoDB Atlas → Connect → Drivers → Node.js
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME   = 'GameDev';

let db;
MongoClient.connect(MONGO_URI)
  .then(async client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB:', DB_NAME);
    // Migration: add coins:0 to users that don't have it
    await db.collection('users').updateMany(
      { coins: { $exists: false } },
      { $set: { coins: 0, activeframe: 'none', framesowned: ['none'] } }
    );
    console.log('Migration complete: coins field ensured on all users');
    // Ensure unique index on friends collection (one doc per user)
    await db.collection('friends').createIndex({ username: 1 }, { unique: true });
    console.log('Index ensured: friends.username (unique)');
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());

// ── Helpers ────────────────────────────────────────────────
function users()        { return db.collection('users'); }
function leaderboards() { return db.collection('leaderboards'); }
function friends()      { return db.collection('friends'); }

// ── POST /api/register ─────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, ingamename } = req.body;
    if (!username || !password || !ingamename) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await users().findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      username,
      password: hashed,
      ingamename,
      overallwins:  0,
      easywin:      0,
      mediumwin:    0,
      hardwin:      0,
      coins:        0,
      activeframe:  'none',
      framesowned:  ['none'],
      avatar:       'lapu',
      createdAt:    new Date()
    };

    const result = await users().insertOne(user);
    // Also create leaderboard entry
    await leaderboards().insertOne({
      userId:     result.insertedId,
      username,
      ingamename,
      overallwins: 0,
      easywin:     0,
      mediumwin:   0,
      hardwin:     0,
    });

    res.json({ success: true, ingamename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/login ────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const user = await users().findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

    // Return safe user data (no password)
    res.json({
      success:      true,
      username:     user.username,
      ingamename:   user.ingamename,
      overallwins:  user.overallwins  || 0,
      easywin:      user.easywin      || 0,
      mediumwin:    user.mediumwin    || 0,
      hardwin:      user.hardwin      || 0,
      coins:        user.coins        || 0,
      activeframe:  user.activeframe  || 'none',
      framesowned:  user.framesowned  || ['none'],
      avatar:       user.avatar       || 'lapu'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/stats/win ────────────────────────────────────
// Called after each fight to record a win
app.post('/api/stats/win', async (req, res) => {
  try {
    const { username, difficulty } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    const field = difficulty + 'win';
    const coinsMap = { easy: 100, medium: 200, hard: 1000 };
    const coins = coinsMap[difficulty] || 100;
    const inc = { overallwins: 1, coins };
    if (['easywin','mediumwin','hardwin'].includes(field)) inc[field] = 1;

    await users().updateOne({ username }, { $inc: inc });
    await leaderboards().updateOne({ username }, { $inc: { overallwins: 1, [field]: 1 } }, { upsert: true });

    res.json({ success: true, coinsEarned: coins });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/stats/buyframe ───────────────────────────────
app.post('/api/stats/buyframe', async (req, res) => {
  try {
    const { username, frameId } = req.body;
    const frameCosts = { gold: 1000, fire: 10000, darkfire: 15000 };
    const cost = frameCosts[frameId];
    if (!cost && frameId !== 'none') return res.status(400).json({ error: 'Invalid frame' });

    const user = await users().findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const framesOwned = user.framesowned || [];
    if (framesOwned.includes(frameId)) return res.status(400).json({ error: 'Already owned' });
    if ((user.coins || 0) < cost) return res.status(400).json({ error: 'Not enough coins' });

    await users().updateOne({ username }, {
      $inc: { coins: -cost },
      $push: { framesowned: frameId }
    });
    res.json({ success: true, coinsLeft: (user.coins || 0) - cost });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/stats/setframe ───────────────────────────────
app.post('/api/stats/setframe', async (req, res) => {
  try {
    const { username, frameId } = req.body;
    await users().updateOne({ username }, { $set: { activeframe: frameId } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/stats/avatar ─────────────────────────────────
app.post('/api/stats/avatar', async (req, res) => {
  try {
    const { username, avatar } = req.body;
    await users().updateOne({ username }, { $set: { avatar } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/leaderboard ───────────────────────────────────
// Returns top 20 players sorted by overallwins, includes avatar + frame
app.get('/api/leaderboard', async (req, res) => {
  try {
    const tab   = req.query.tab || 'overall';
    const field = tab === 'overall' ? 'overallwins' : tab + 'win';
    const sort  = {};
    sort[field] = -1;

    // Join with users to get avatar and activeframe
    const rows = await leaderboards()
      .aggregate([
        { $sort: sort },
        { $limit: 20 },
        { $lookup: {
            from: 'users',
            localField: 'username',
            foreignField: 'username',
            as: 'userdata'
        }},
        { $addFields: {
            avatar:      { $ifNull: [{ $arrayElemAt: ['$userdata.avatar', 0] }, 'lapu'] },
            activeframe: { $ifNull: [{ $arrayElemAt: ['$userdata.activeframe', 0] }, 'none'] },
            ingamename:  { $ifNull: [{ $arrayElemAt: ['$userdata.ingamename', 0] }, '$username'] },
            overallwins: { $ifNull: [{ $arrayElemAt: ['$userdata.overallwins', 0] }, '$overallwins'] },
            easywin:     { $ifNull: [{ $arrayElemAt: ['$userdata.easywin', 0] }, '$easywin'] },
            mediumwin:   { $ifNull: [{ $arrayElemAt: ['$userdata.mediumwin', 0] }, '$mediumwin'] },
            hardwin:     { $ifNull: [{ $arrayElemAt: ['$userdata.hardwin', 0] }, '$hardwin'] },
        }},
        { $project: { userdata: 0 } }
      ]).toArray();

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/user/:username ────────────────────────────────
app.get('/api/user/:username', async (req, res) => {
  try {
    const user = await users().findOne(
      { username: req.params.username },
      { projection: { password: 0 } } // exclude password
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/friends/:username ─────────────────────────────
// Returns the friend list and pending requests for a user.
// Response: { friends: [...enriched], incoming: [...usernames], outgoing: [...usernames] }
app.get('/api/friends/:username', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not ready' });
    const { username } = req.params;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'username required' });
    }

    // Look up the friends doc; if none exists return empty arrays
    const doc = await friends().findOne({ username });
    if (!doc) {
      return res.json({ friends: [], incoming: [], outgoing: [] });
    }

    const friendUsernames   = doc.friends         || [];
    const incomingUsernames = doc.pendingIncoming  || [];
    const outgoingUsernames = doc.pendingOutgoing  || [];

    // Enrich each friend entry with ingamename, avatar, overallwins from users collection
    let enrichedFriends = [];
    if (friendUsernames.length > 0) {
      const userDocs = await users()
        .find(
          { username: { $in: friendUsernames } },
          { projection: { username: 1, ingamename: 1, avatar: 1, overallwins: 1, activeframe: 1 } }
        )
        .toArray();

      // Build a map for O(1) lookups
      const userMap = {};
      for (const u of userDocs) {
        userMap[u.username] = u;
      }

      // Preserve the order stored in the friends array
      enrichedFriends = friendUsernames.map(uname => {
        const u = userMap[uname];
        return {
          username:    uname,
          ingamename:  u ? u.ingamename  : uname,
          avatar:      u ? u.avatar      : 'lapu',
          frame:       u ? (u.activeframe || 'none') : 'none',
          overallwins: u ? (u.overallwins || 0) : 0
        };
      });
    }

    res.json({
      friends:  enrichedFriends,
      incoming: incomingUsernames,
      outgoing: outgoingUsernames
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/friends/request ──────────────────────────────
app.post('/api/friends/request', async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !from.trim() || !to || !to.trim())
      return res.status(400).json({ error: 'from and to are required' });
    if (from === to)
      return res.status(400).json({ error: 'Cannot add yourself' });

    const toUser = await users().findOne({ username: to });
    if (!toUser) return res.status(404).json({ error: 'User not found' });

    // Check if already friends or request already pending
    const fromDoc = await friends().findOne({ username: from });
    if (fromDoc) {
      if ((fromDoc.friends || []).includes(to))
        return res.status(400).json({ error: 'Already friends' });
      if ((fromDoc.pendingOutgoing || []).includes(to))
        return res.status(400).json({ error: 'Friend request already sent' });
      if ((fromDoc.pendingIncoming || []).includes(to))
        return res.status(400).json({ error: 'This user already sent you a request' });
    }

    // Upsert: add `to` to from's pendingOutgoing, add `from` to to's pendingIncoming
    // Use $addToSet to prevent duplicates
    await friends().updateOne(
      { username: from },
      { $setOnInsert: { username: from, friends: [], pendingIncoming: [] }, $addToSet: { pendingOutgoing: to } },
      { upsert: true }
    );
    await friends().updateOne(
      { username: to },
      { $setOnInsert: { username: to, friends: [], pendingOutgoing: [] }, $addToSet: { pendingIncoming: from } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/friends/accept ───────────────────────────────
app.post('/api/friends/accept', async (req, res) => {
  try {
    const { username, requester } = req.body;
    if (!username || !username.trim() || !requester || !requester.trim())
      return res.status(400).json({ error: 'username and requester are required' });

    const doc = await friends().findOne({ username });
    if (!doc || !(doc.pendingIncoming || []).includes(requester))
      return res.status(400).json({ error: 'No pending request from that user' });

    // Remove from pending, add to friends — both sides
    await friends().updateOne(
      { username },
      { $pull: { pendingIncoming: requester }, $addToSet: { friends: requester } }
    );
    await friends().updateOne(
      { username: requester },
      { $pull: { pendingOutgoing: username }, $addToSet: { friends: username } }
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/friends/decline ──────────────────────────────
app.post('/api/friends/decline', async (req, res) => {
  try {
    const { username, requester } = req.body;
    if (!username || !username.trim() || !requester || !requester.trim())
      return res.status(400).json({ error: 'username and requester are required' });

    await friends().updateOne({ username }, { $pull: { pendingIncoming: requester } });
    await friends().updateOne({ username: requester }, { $pull: { pendingOutgoing: username } });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/friends/remove ─────────────────────────────
app.delete('/api/friends/remove', async (req, res) => {
  try {
    const { username, friendUsername } = req.body;
    if (!username || !username.trim() || !friendUsername || !friendUsername.trim())
      return res.status(400).json({ error: 'username and friendUsername are required' });

    await friends().updateOne({ username }, { $pull: { friends: friendUsername } });
    await friends().updateOne({ username: friendUsername }, { $pull: { friends: username } });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/quests/claim ─────────────────────────────────
app.post('/api/quests/claim', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not ready' });
    const { username, coins } = req.body;
    if (!username || !coins) return res.status(400).json({ error: 'username and coins required' });
    await users().updateOne({ username }, { $inc: { coins: parseInt(coins) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Silence Chrome DevTools probe
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.json({});
});

// SPA fallback — serve index.html for game routes BEFORE static middleware
// so /login, /home, /select, /battle don't get a 404 from express.static
const SPA_ROUTES = ['/login', '/home', '/select', '/battle', '/result'];
SPA_ROUTES.forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile('index.html', { root: '.' });
  });
});

// Serve static game files — registered AFTER API routes so /api/* is never shadowed
app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`Filipino Heroes Fighter server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to play`);
});
