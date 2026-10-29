import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import MobileNav from './components/MobileNav.jsx';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SkillTree from './pages/SkillTree.jsx';
import Practice from './pages/Practice.jsx';
import TimedExam from './pages/TimedExam.jsx';
import ExamResults from './pages/ExamResults.jsx';
import CaseStudies from './pages/CaseStudies.jsx';
import CaseStudyDetail from './pages/CaseStudyDetail.jsx';
import Challenges from './pages/Challenges.jsx';
import ChallengeDetail from './pages/ChallengeDetail.jsx';
import Flashcards from './pages/Flashcards.jsx';
import GembaZone from './pages/GembaZone.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useProfile } from './context/ProfileContext.jsx';

function FullScreenLoader() {
  return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading PowerPrep Quest...</div>;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { loading: profileLoading } = useProfile();

  if (authLoading) return <FullScreenLoader />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (profileLoading) return <FullScreenLoader />;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileNav />
      <main className="md:ml-72 pt-16 pb-20 md:pt-0 md:pb-0 px-4 md:px-10 py-6 md:py-10 max-w-6xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/skill-tree" element={<SkillTree />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exam" element={<TimedExam />} />
          <Route path="/exam/results" element={<ExamResults />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/case-studies/:id" element={<CaseStudyDetail />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/gemba" element={<GembaZone />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
