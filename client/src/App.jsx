import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import HostGame from './pages/HostGame.jsx';
import JoinGame from './pages/JoinGame.jsx';
import PlayerGame from './pages/PlayerGame.jsx';
import QuizLibrary from './pages/QuizLibrary.jsx';
import CreateQuiz from './pages/CreateQuiz.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/"                element={<Home />} />
      <Route path="/host"            element={<HostGame />} />
      <Route path="/join"            element={<JoinGame />} />
      <Route path="/join/:code"      element={<JoinGame />} />
      <Route path="/play"            element={<PlayerGame />} />
      <Route path="/quizzes"         element={<QuizLibrary />} />
      <Route path="/quizzes/new"     element={<CreateQuiz />} />
      <Route path="/quizzes/:id/edit"element={<CreateQuiz />} />
      <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
  );
}
