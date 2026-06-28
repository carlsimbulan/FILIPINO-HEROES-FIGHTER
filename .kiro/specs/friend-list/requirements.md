# Requirements Document

## Introduction

This feature adds a friend list system to the Filipino Heroes Fighter game. Players can add other registered players as friends, view their friends' profiles (in-game name, avatar, win stats), and manage their friend list through a slide-out drawer panel on the right side of the screen. Friend data is persisted in MongoDB.

## Glossary

- **Friend_List**: The collection of friend relationships associated with a user's account.
- **Friend_Request**: A pending invitation from one player to another to become friends.
- **Friend_Drawer**: The slide-out UI panel on the right side of the game screen that displays the friend list.
- **System**: The Filipino Heroes Fighter Node.js/Express backend and vanilla JS frontend together.
- **Player**: A registered user of the Filipino Heroes Fighter game.
- **Friend**: A mutual or one-directional relationship between two Players.

## Requirements

### Requirement 1: View Friend List

**User Story:** As a player, I want to open a friend list panel, so that I can see who my friends are at a glance.

#### Acceptance Criteria

1. WHEN a logged-in player clicks the friend list toggle button, THE Friend_Drawer SHALL slide open from the right side of the screen.
2. WHEN the Friend_Drawer is open and the player clicks the toggle button again, THE Friend_Drawer SHALL close.
3. WHILE the Friend_Drawer is open, THE System SHALL display each friend's in-game name, avatar, and overall win count.
4. WHILE the Friend_Drawer is open and the player has no friends, THE System SHALL display a message indicating the friend list is empty.
5. IF the player is not logged in, THEN THE Friend_Drawer SHALL NOT be accessible and the toggle button SHALL be hidden.

---

### Requirement 2: Add a Friend

**User Story:** As a player, I want to add another player as a friend by their username, so that I can keep track of people I enjoy playing with.

#### Acceptance Criteria

1. WHILE the Friend_Drawer is open, THE System SHALL display an input field and an "Add Friend" button.
2. WHEN a player submits a valid username via the Add Friend input, THE System SHALL send a friend request to that player.
3. WHEN a player submits a username that does not exist, THE System SHALL display an error message indicating the user was not found.
4. WHEN a player submits their own username, THE System SHALL display an error message preventing self-friending.
5. WHEN a player submits a username that is already in their friend list or has a pending request, THE System SHALL display an informative message and not create a duplicate entry.
6. WHEN a player submits an empty or whitespace-only username, THE System SHALL prevent the request and display a validation error.

---

### Requirement 3: Accept or Decline Friend Requests

**User Story:** As a player, I want to see incoming friend requests and accept or decline them, so that I control who is on my friend list.

#### Acceptance Criteria

1. WHILE the Friend_Drawer is open and there are pending incoming requests, THE System SHALL display a "Requests" section listing each requester's in-game name.
2. WHEN a player accepts a friend request, THE System SHALL add the requester to the player's friend list and add the player to the requester's friend list.
3. WHEN a player declines a friend request, THE System SHALL remove the request without adding either player to the other's friend list.
4. WHEN a friend request is accepted or declined, THE System SHALL remove the request from the pending requests section immediately.

---

### Requirement 4: Remove a Friend

**User Story:** As a player, I want to remove someone from my friend list, so that I can keep my list up to date.

#### Acceptance Criteria

1. WHILE the Friend_Drawer is open, THE System SHALL display a remove button next to each friend entry.
2. WHEN a player clicks the remove button for a friend, THE System SHALL remove that friend from the player's friend list.
3. WHEN a player removes a friend, THE System SHALL also remove the player from the removed friend's friend list (mutual removal).
4. WHEN a friend is removed, THE Friend_Drawer SHALL update immediately to reflect the change without a full page reload.

---

### Requirement 5: Persist Friend Data

**User Story:** As a player, I want my friend list to be saved, so that it is still there the next time I log in.

#### Acceptance Criteria

1. THE System SHALL store friend relationships and pending requests in MongoDB under the `GameDev` database.
2. WHEN a player logs in, THE System SHALL load their friend list and pending requests from MongoDB.
3. WHEN any friend list change occurs (add, accept, decline, remove), THE System SHALL persist the change to MongoDB before confirming success to the client.
4. IF a database error occurs during a friend list operation, THEN THE System SHALL return an appropriate error response and not modify the in-memory state.

---

### Requirement 6: Friend List API

**User Story:** As a developer, I want a clean REST API for friend list operations, so that the frontend can interact with friend data reliably.

#### Acceptance Criteria

1. THE System SHALL expose a `GET /api/friends/:username` endpoint that returns the friend list for the given user.
2. THE System SHALL expose a `POST /api/friends/request` endpoint that sends a friend request from one user to another.
3. THE System SHALL expose a `POST /api/friends/accept` endpoint that accepts a pending friend request.
4. THE System SHALL expose a `POST /api/friends/decline` endpoint that declines a pending friend request.
5. THE System SHALL expose a `DELETE /api/friends/remove` endpoint that removes a friend relationship between two users.
6. IF a request is made to any friend API endpoint with a missing or invalid `username` field, THEN THE System SHALL return a `400` status with a descriptive error message.
7. IF a request is made to any friend API endpoint for a username that does not exist, THEN THE System SHALL return a `404` status.
