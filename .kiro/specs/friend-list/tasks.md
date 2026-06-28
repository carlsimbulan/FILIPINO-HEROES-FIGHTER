# Implementation Plan: Friend List

## Overview

Implement the friend list feature incrementally: data layer first, then API routes, then frontend API client, then the UI drawer. Each step is testable before moving to the next.

## Tasks

- [x] 1. Set up MongoDB data layer for friends
  - Add `function friends() { return db.collection('friends'); }` helper to `server.js`
  - Create a MongoDB index on `friends.username` (unique) to enforce one doc per user
  - Define the document shape: `{ username, friends: [], pendingIncoming: [], pendingOutgoing: [] }`
  - _Requirements: 5.1_

- [x] 2. Implement `GET /api/friends/:username` endpoint
  - [x] 2.1 Add route in `server.js` that returns a user's friends list and pending incoming requests
    - Look up the user's friends doc; return empty arrays if none exists
    - Join with `users` collection to enrich each friend entry with `ingamename`, `avatar`, `overallwins`
    - Response shape: `{ friends: [...enriched], incoming: [...usernames], outgoing: [...usernames] }`
    - _Requirements: 6.1, 1.3, 5.2_
  - [ ]* 2.2 Write unit test for GET endpoint
    - Test user with no friends doc returns `{ friends: [], incoming: [], outgoing: [] }`
    - Test enrichment: friends array includes `ingamename`, `avatar`, `overallwins` from users collection
    - _Requirements: 1.3, 6.7_

- [x] 3. Implement `POST /api/friends/request` endpoint
  - [x] 3.1 Add route in `server.js` for sending a friend request
    - Validate `from` and `to` are present and non-empty → 400 if missing
    - Validate `from !== to` → 400 with "Cannot add yourself"
    - Verify `to` user exists in `users` collection → 404 if not found
    - Check if already friends or request already pending → 400 if so
    - Upsert friends doc for `from`: push `to` to `pendingOutgoing`
    - Upsert friends doc for `to`: push `from` to `pendingIncoming`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 6.2, 5.3_
  - [ ]* 3.2 Write property test: no duplicate pending entries
    - **Property 4: No duplicate friend entries**
    - **Validates: Requirements 2.5**
    - Generate random valid username pairs, send request multiple times, verify `pendingIncoming` and `pendingOutgoing` contain no duplicates
    - _Feature: friend-list, Property 4: No duplicate friend entries_
  - [ ]* 3.3 Write property test: self-friending rejected
    - **Property 5: Self-friending is rejected**
    - **Validates: Requirements 2.4**
    - For any username, request with `from === to` should return 400 and leave the doc unchanged
    - _Feature: friend-list, Property 5: Self-friending always rejected_
  - [ ]* 3.4 Write property test: whitespace-only targets rejected
    - **Property 6: Whitespace rejection**
    - **Validates: Requirements 2.6**
    - Generate whitespace-only strings; verify client-side `trim().length === 0` check fires before any API call
    - _Feature: friend-list, Property 6: Whitespace-only username rejected_
  - [ ]* 3.5 Write property test: non-existent user returns 404
    - **Property 8: Non-existent user returns 404**
    - **Validates: Requirements 2.3, 6.7**
    - Generate usernames guaranteed not to be in the database; verify 404 response
    - _Feature: friend-list, Property 8: Non-existent user returns 404_

- [x] 4. Implement `POST /api/friends/accept` and `POST /api/friends/decline` endpoints
  - [x] 4.1 Add accept route in `server.js`
    - Validate `username` and `requester` present → 400 if missing
    - Verify `requester` is in `username`'s `pendingIncoming` → 400 if not
    - Remove `requester` from `username.pendingIncoming` and `requester.pendingOutgoing`
    - Push `requester` into `username.friends` and push `username` into `requester.friends`
    - _Requirements: 3.2, 5.3_
  - [x] 4.2 Add decline route in `server.js`
    - Validate fields present → 400 if missing
    - Remove `requester` from `username.pendingIncoming` and `username` from `requester.pendingOutgoing`
    - Do not add to either `friends` array
    - _Requirements: 3.3, 5.3_
  - [ ]* 4.3 Write property test: friendship symmetry after accept
    - **Property 1: Friend relationship is symmetric after acceptance**
    - **Validates: Requirements 3.2**
    - Generate two random usernames, send request, accept, verify both appear in each other's `friends` arrays and neither appears in pending
    - _Feature: friend-list, Property 1: Symmetry after accept_
  - [ ]* 4.4 Write property test: decline leaves no trace
    - **Property 2: Declined requests leave no trace**
    - **Validates: Requirements 3.3**
    - Generate two random usernames, send request, decline, verify neither user appears in the other's friends or pending arrays
    - _Feature: friend-list, Property 2: Declined leaves no trace_

- [x] 5. Checkpoint — Ensure all backend tests pass
  - All implemented routes should handle happy paths and error cases correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `DELETE /api/friends/remove` endpoint
  - [x] 6.1 Add remove route in `server.js`
    - Validate `username` and `friendUsername` present → 400 if missing
    - Remove `friendUsername` from `username.friends`
    - Remove `username` from `friendUsername.friends`
    - _Requirements: 4.2, 4.3, 5.3_
  - [ ]* 6.2 Write property test: removal is symmetric
    - **Property 3: Removal is symmetric**
    - **Validates: Requirements 4.3**
    - Generate two users who are friends, remove from one side, verify neither appears in the other's `friends` array
    - _Feature: friend-list, Property 3: Removal is symmetric_

- [x] 7. Add friend API methods to `js/api.js`
  - Add `getFriends(username)` → GET `/api/friends/:username`
  - Add `sendFriendRequest(from, to)` → POST `/api/friends/request`
  - Add `acceptFriendRequest(username, requester)` → POST `/api/friends/accept`
  - Add `declineFriendRequest(username, requester)` → POST `/api/friends/decline`
  - Add `removeFriend(username, friendUsername)` → DELETE `/api/friends/remove`
  - _Requirements: 6.1–6.5_

- [x] 8. Implement `FriendDrawer` UI class (`js/friendDrawer.js`)
  - [x] 8.1 Create the drawer shell with open/close animation
    - Fixed position panel on the right edge of the screen (width ~300px), sliding in/out via CSS transform
    - Styled to match the existing dark game aesthetic (`background: rgba(8,14,28,0.92)`, gold accents)
    - Header with "FRIENDS" title and a close button
    - `open()`, `close()`, `toggle()`, `destroy()` methods
    - _Requirements: 1.1, 1.2_
  - [x] 8.2 Implement friend list section
    - Call `GameAPI.getFriends(username)` on open
    - Render each friend as a row: avatar image, ingamename, overall wins, and a remove button
    - Show empty-state message when `friends` array is empty
    - _Requirements: 1.3, 1.4, 4.1_
  - [x] 8.3 Implement pending requests section
    - Render a "Requests" section above the friend list when `incoming` array is non-empty
    - Each request row shows the requester's username and Accept / Decline buttons
    - On accept: call `GameAPI.acceptFriendRequest`, then re-render
    - On decline: call `GameAPI.declineFriendRequest`, then re-render
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 8.4 Implement Add Friend input and validation
    - Input field + "ADD" button at the top of the drawer
    - Client-side: trim input; reject if empty/whitespace (show inline error)
    - Client-side: reject if input equals current username (show inline error)
    - On submit: call `GameAPI.sendFriendRequest`, show success or API error inline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 8.5 Wire remove buttons
    - Each friend row's remove button calls `GameAPI.removeFriend`, then re-renders the list
    - _Requirements: 4.2, 4.3, 4.4_
  - [ ]* 8.6 Write property test: GET response enrichment
    - **Property 7: GET response includes enriched display data**
    - **Validates: Requirements 1.3**
    - For any set of users who are friends, every entry in the GET response `friends` array should have `ingamename`, `avatar`, and `overallwins`
    - _Feature: friend-list, Property 7: Enriched friend entries_

- [x] 9. Integrate `FriendDrawer` into `HomeState`
  - In `HomeState._buildUI()`, add a "👥 FRIENDS" toggle button to the existing `rightBtns` row (after the shop button)
  - On `HomeState.enter()`: instantiate `new FriendDrawer(rawUsername)` and store as `this._friendDrawer`
  - On `HomeState.exit()`: call `this._friendDrawer.destroy()` to clean up DOM
  - Wire the toggle button to `this._friendDrawer.toggle()`
  - Add `<script src="js/friendDrawer.js"></script>` to `index.html` before `homeState.js`
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Run all backend and frontend tests
  - Verify drawer opens/closes, friend request flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with minimum 100 iterations each
- The `friends` collection is separate from `users` to avoid bloating user documents
