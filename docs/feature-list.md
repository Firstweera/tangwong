# TangWong Feature List

## Product Vision

TangWong is a mobile-first multiplayer board game platform.

The goal is to let friends create rooms, join quickly, and play board games online together.

Primary focus:

- Multiplayer
- Social interaction
- Hidden information games
- Party games
- Strategy board games

---

# Phase 1 - Playable MVP

Goal:

Friends can create a room and finish an entire game.

---

## Room System

### Create Room

- Create room
- Generate room code
- Generate invite link

### Join Room

- Join via room code
- Join via invite link

### Leave Room

- Leave room
- Rejoin room

### Room Settings

- Room name
- Max players (bounded by the selected game's player range, e.g. Avalon 5–10, Coup 2–6)
- Public/private

---

## Lobby System

### Player Management

- Player list
- Host badge
- Ready status
- Online status

### Host Controls

- Start game
- Change game
- Kick player
- Transfer host

### Game Selection

- Select available game
- View game information

---

## User Identity

### Guest Mode

- Nickname
- Avatar

No login required.

---

## Chat System

### Lobby Chat

- Send message
- Emoji reactions

### In Game Chat

- Public chat
- System messages

---

# Phase 2 - Multiplayer Foundation

Goal:

Support all future games.

---

## Player Presence

- Online (heartbeat-based, synced across clients)
- Offline (pruned after missed heartbeats)
- Reconnecting (rejoin restores room + chat; deep reconnect pending Socket.io)

### Reconnect

- Resume game state
- Rejoin room

---

## Turn System

- Current player
- Turn timer
- Skip turn

---

## Notification System

- Player joined
- Player left
- Turn started
- Game started

---

## Host Tools

- Pause game
- Resume game
- Force next phase
- End game

---

# Phase 3 - Generic Game Engine

Goal:

Create reusable engine for all games.

---

## Game State

- Room state
- Public state
- Private player state

---

## Game Phases

Examples:

- Lobby
- Setup
- Discussion
- Voting
- Resolution
- End

---

## Game Events

Examples:

- Vote
- Play card
- Reveal role
- Draw card
- Gain resource

---

## Win Conditions

- Team win
- Individual win
- Score win

---

# Phase 4 - Avalon

Goal:

First playable game.

---

## Setup

- Random roles
- Assign teams

### Roles

- Merlin
- Percival
- Assassin
- Loyal Servant
- Minion

---

## Gameplay

### Team Selection

- Select team

### Voting

- Approve
- Reject

### Mission

- Success
- Fail

### End Game

- Assassin phase
- Reveal results

---

# Phase 5 - Salem 1692

## Setup

- Deal role cards

### Roles

- Villager
- Witch

---

## Gameplay

### Accusation

- Accuse player

### Trial

- Vote guilty
- Vote innocent

### Reveal

- Reveal evidence

---

# Phase 6 - Sheriff

## Gameplay

### Market

- Draw goods

### Bagging

- Select goods

### Declaration

- Declare goods

### Inspection

- Inspect player

### Bribery

- Offer bribe

### Scoring

- Calculate score

---

# Phase 7 - User Account

Optional

---

## Authentication

- Email
- Google

### Profile

- Avatar
- Statistics

---

# Phase 8 - Friends

## Friends

- Add friend
- Remove friend

### Invitations

- Invite to room

---

# Phase 9 - Match History

## History

- Games played
- Wins
- Losses

### Statistics

- Win rate
- Favorite game

---

# Phase 10 - Future Games

## Party

- Exploding Kittens
- Dixit
- Coup
- Werewolf

## Strategy

- Istanbul
- Splendor-like
- Ticket to Ride-like

---

# Out Of Scope

Do NOT build yet:

- Store
- Monetization
- Battle Pass
- Ranking
- Guilds
- Matchmaking
- AI Players
- Spectator Mode
- Tournament System

Focus on getting a group of friends from:

Create Room
→ Lobby
→ Avalon
→ End Game

as fast as possible.
