import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import LandingPage from './pages/LandingPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import DashboardPage from './pages/DashboardPage'
import InterviewSetupPage from './pages/InterviewSetupPage'
import InterviewSessionPage from './pages/InterviewSessionPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import ResumeRatingPage from './pages/ResumeRatingPage'

function Protected({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/interview/setup"   element={<Protected><InterviewSetupPage /></Protected>} />
      <Route path="/interview/session" element={<Protected><InterviewSessionPage /></Protected>} />
      <Route path="/interview/results" element={<Protected><ResultsPage /></Protected>} />
      <Route path="/history"  element={<Protected><HistoryPage /></Protected>} />
      <Route path="/resume/rating"  element={<Protected><ResumeRatingPage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
