# 🎮 Trivia Blitz — Real-Time Multiplayer Trivia

A full-stack Kahoot-style game built with **React + Vite**, **Node.js + Express**, and **Socket.io**.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Real-time multiplayer** | WebSocket-powered via Socket.io |
| **Host dashboard** | Create session, share QR code, control game flow |
| **Player flow** | Join by code or QR scan, answer on own device |
| **Speed scoring** | 1,000 base + up to 500 speed bonus per correct answer |
| **Live leaderboard** | Updates after every question |
| **Timer sync** | Server-authoritative timer, clients sync to `startTime` timestamp |
| **QR code** | Generated from `qrcode.react` for the join URL |
| **Sound effects** | Web Audio API — no external files needed |
| **Animations** | Tailwind CSS keyframe animations |
| **Mobile-first** | Responsive layout, touch-friendly buttons |

---

## 🏗️ Project Structure

```
kahoot-clone/
├── package.json              ← root (run both servers)
│
├── server/
│   ├── package.json
│   └── src/
│       ├── index.js          ← Express + Socket.io server
│       ├── gameManager.js    ← in-memory session store
│       └── questions.js      ← trivia question bank
│
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx           ← routes
        ├── socket.js         ← Socket.io singleton
        ├── index.css
        ├── utils/
        │   └── sounds.js     ← Web Audio API tones
        ├── components/
        │   ├── AnswerButton.jsx
        │   ├── Leaderboard.jsx
        │   ├── PlayerList.jsx
        │   ├── ProgressBar.jsx
        │   ├── QRCodeDisplay.jsx
        │   └── Timer.jsx
        └── pages/
            ├── Home.jsx
            ├── HostGame.jsx   ← full host flow
            ├── JoinGame.jsx   ← player join
            └── PlayerGame.jsx ← full player flow
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and **npm** v9+

### 1 — Install dependencies

```bash
cd kahoot-clone
npm install           # installs concurrently at root
npm run install:all   # installs server + client deps
```

### 2 — Start both servers (development)

```bash
npm run dev
```

This starts:
- **Server** on `http://localhost:3001`
- **Client** (Vite) on `http://localhost:5173`

> Vite proxies `/socket.io` to the server, so no CORS issues in dev.

### 3 — Open the app

Go to **http://localhost:5173** in your browser.

---

## 🎯 How to Play (End-to-End)

### Host
1. Click **"Host a Game"** on the home screen
2. Click **"✨ Create Game Session"**
3. Share the **6-character code** or **QR code** with players
4. Click **"🚀 Start Game"** once players have joined
5. During each question:
   - Watch answers come in live
   - Timer auto-ends the question OR click **"⏩ End Early"**
6. Click **"📊 Show Leaderboard"** after each question
7. Click **"▶ Next Question"** to continue

### Player
1. Go to `http://localhost:5173/join` (or scan QR)
2. Enter the 6-char session code and a nickname
3. Wait in the lobby until the host starts
4. Tap an answer as fast as you can — speed earns bonus points!
5. See if you were right, your points, and the leaderboard after each round

---

## ⚙️ Configuration

### Server
| Env var | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |

### Adding / editing questions
Edit **`server/src/questions.js`**. Each question follows this shape:

```js
{
  id: 11,
  question: "What is your question?",
  options: ["Option A", "Option B", "Option C", "Option D"],
  correctIndex: 2,   // 0-based index of the correct option
  timeLimit: 10,     // seconds
  explanation: "Optional fun fact shown after the answer.",
}
```

### Connecting to a DB (future)
Replace the `questions` array import in `gameManager.js` with an async DB query:
```js
// Before:  const questions = require('./questions');
// After:
async function getQuestions() {
  return await db.query('SELECT * FROM questions ORDER BY id');
}
```

---

## 🔌 Socket.io Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `host:create` | — | Create new session |
| `host:start` | `{ code }` | Start the game |
| `host:end-question` | `{ code }` | End question early |
| `host:show-leaderboard` | `{ code }` | Show leaderboard to all |
| `host:next-question` | `{ code }` | Advance to next question |
| `player:join` | `{ code, nickname }` | Join a session |
| `player:answer` | `{ code, answerIndex, timeRemaining }` | Submit answer |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `game:question-start` | question data + `startTime` | New question broadcast |
| `game:question-end` | `{ correctIndex, playerResults, answerCounts }` | Question ended |
| `game:leaderboard` | `{ leaderboard, isLastQuestion }` | Show leaderboard |
| `game:over` | `{ leaderboard }` | Game finished |
| `host:player-joined` | `{ players }` | Player list updated |
| `host:answer-received` | `{ answeredCount, totalPlayers }` | Live answer count |
| `game:host-disconnected` | — | Host left |

---

## 🏆 Scoring Formula

```
correct answer  → 1,000 + round(500 × timeRemaining / timeLimit)
wrong answer    → 0 points
no answer       → 0 points
```

Maximum score per question: **1,500 points** (answer instantly).

---

## 📱 Mobile Support

- Touch-optimised answer buttons
- Safe-area padding for iPhone notch
- Responsive layout (stacks vertically on small screens)
- QR code works for mobile camera join

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Real-time | Socket.io v4 |
| QR Code | qrcode.react |
| Backend | Node.js + Express |
| Session store | In-memory (Map) |
| Sounds | Web Audio API |
