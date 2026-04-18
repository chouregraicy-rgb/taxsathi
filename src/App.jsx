// CoachOS v3 — App.jsx
// Entry point — VS Code mein yahan se shuru karo

import CoachOS from "./components/CoachOS";

export default function App() {
  return <CoachOS />;
}

// ─── VS Code Setup Instructions ───────────────────────────
//
// STEP 1: New Vite project banao
// npm create vite@latest coachOS -- --template react
// cd coachOS
// npm install
//
// STEP 2: Folder structure banao
// src/
// ├── App.jsx                      ← This file
// ├── components/
// │   └── CoachOS.jsx              ← Main app
// └── data/
//     ├── SyllabusData.js          ← NEET + JEE + Govt syllabus
//     ├── GameData.js              ← Badges + Gamification
//     └── InstituteConfig.js       ← White label config
//
// STEP 3: Files copy karo
// - CoachOS.jsx → src/components/CoachOS.jsx
// - SyllabusData.js → src/data/SyllabusData.js
// - GameData.js → src/data/GameData.js
// - InstituteConfig.js → src/data/InstituteConfig.js
//
// STEP 4: Run karo
// npm run dev
//
// STEP 5: Browser mein open karo
// http://localhost:5173
//
// ─── Demo PINs ─────────────────────────────────────────────
// 1111 → Director Medical (NEET + JEE wing)
// 2222 → Director Govt (SSC/Railway/Banking etc.)
// 3333 → Teacher
// 4444 → NEET Student (Coaching mode)
// 5555 → IIT-JEE Student (Coaching mode)
// 6666 → Govt Exam Student (Coaching mode)
// 7777 → Parent (Rahul + Priya — 2 children)
// 8888 → Self-Study Free (NEET)
// 9999 → Self-Study Paid Premium (SSC CGL)
