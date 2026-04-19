/**
 * Trivia Question Bank
 *
 * Each question object has:
 *   id          - unique identifier (for future DB storage)
 *   question    - the question text shown to players
 *   options     - array of exactly 4 answer strings
 *   correctIndex- 0-based index of the correct option
 *   timeLimit   - seconds players have to answer (default 10)
 *   explanation - optional fun fact shown after the question ends
 *
 * To extend: replace this array with a DB query (e.g. SQLite/Postgres)
 * and the rest of the server code will work unchanged.
 */
const questions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2,
    timeLimit: 10,
    explanation: "Paris has been the capital of France since 987 AD.",
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    timeLimit: 10,
    explanation: "Mars appears red due to iron oxide (rust) coating its surface.",
  },
  {
    id: 3,
    question: "What is 2 to the power of 10?",
    options: ["512", "1,024", "2,048", "256"],
    correctIndex: 1,
    timeLimit: 15,
    explanation: "2¹⁰ = 1,024 — that's why 1 KB is roughly 1,000 bytes in computing.",
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci"],
    correctIndex: 3,
    timeLimit: 10,
    explanation: "Leonardo da Vinci painted the Mona Lisa between 1503 and 1519.",
  },
  {
    id: 5,
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctIndex: 2,
    timeLimit: 10,
    explanation: "Au comes from the Latin word 'Aurum', meaning gold.",
  },
  {
    id: 6,
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctIndex: 1,
    timeLimit: 10,
    explanation: "Hexa- is a Greek prefix meaning six.",
  },
  {
    id: 7,
    question: "What year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctIndex: 2,
    timeLimit: 15,
    explanation: "WWII ended in 1945: V-E Day in May and V-J Day in September.",
  },
  {
    id: 8,
    question: "Which element has atomic number 1?",
    options: ["Helium", "Oxygen", "Carbon", "Hydrogen"],
    correctIndex: 3,
    timeLimit: 10,
    explanation: "Hydrogen is the lightest and most abundant element in the universe.",
  },
  {
    id: 9,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Pacific", "Arctic"],
    correctIndex: 2,
    timeLimit: 10,
    explanation: "The Pacific Ocean covers more than 30% of Earth's surface.",
  },
  {
    id: 10,
    question: "What language was the first iPhone app written in?",
    options: ["Swift", "Java", "Objective-C", "C++"],
    correctIndex: 2,
    timeLimit: 15,
    explanation: "Objective-C was the primary iOS language until Swift launched in 2014.",
  },
];

module.exports = questions;
