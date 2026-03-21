import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TopicCatalogPage from './pages/TopicCatalogPage';
import TopicDetailPage from './pages/TopicDetailPage';
import SessionLobbyPage from './pages/SessionLobbyPage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import SessionDebriefPage from './pages/SessionDebriefPage';
import StudioDashboardPage from './pages/StudioDashboardPage';
import TopicCreatorPage from './pages/TopicCreatorPage';
import TopicEditorPage from './pages/TopicEditorPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? <>{children}</> : <Navigate to="/auth/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/topics" element={<ProtectedRoute><TopicCatalogPage /></ProtectedRoute>} />
        <Route path="/topics/:topicId" element={<ProtectedRoute><TopicDetailPage /></ProtectedRoute>} />
        <Route path="/session/:sessionId/lobby" element={<ProtectedRoute><SessionLobbyPage /></ProtectedRoute>} />
        <Route path="/session/:sessionId" element={<ProtectedRoute><ActiveSessionPage /></ProtectedRoute>} />
        <Route path="/session/:sessionId/debrief" element={<ProtectedRoute><SessionDebriefPage /></ProtectedRoute>} />
        <Route path="/studio" element={<ProtectedRoute><StudioDashboardPage /></ProtectedRoute>} />
        <Route path="/studio/topics/create" element={<ProtectedRoute><TopicCreatorPage /></ProtectedRoute>} />
        <Route path="/studio/topics/:topicId/edit" element={<ProtectedRoute><TopicEditorPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
