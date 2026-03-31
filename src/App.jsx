import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import DashboardPage from './pages/DashboardPage'
import InterviewSetupPage from './pages/InterviewSetupPage'
import InterviewSessionPage from './pages/InterviewSessionPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import ResumeRatingPage from './pages/ResumeRatingPage'
import DSARoundPage from './pages/DSARoundPage'
import NotFoundPage from './pages/NotFoundPage'

function Protected({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route path="/dashboard"         element={<Protected><ErrorBoundary><DashboardPage /></ErrorBoundary></Protected>} />
        <Route path="/interview/setup"   element={<Protected><ErrorBoundary><InterviewSetupPage /></ErrorBoundary></Protected>} />
        <Route path="/interview/session" element={<Protected><ErrorBoundary><InterviewSessionPage /></ErrorBoundary></Protected>} />
        <Route path="/interview/results" element={<Protected><ErrorBoundary><ResultsPage /></ErrorBoundary></Protected>} />
        <Route path="/history"           element={<Protected><ErrorBoundary><HistoryPage /></ErrorBoundary></Protected>} />
        <Route path="/resume/rating"     element={<Protected><ErrorBoundary><ResumeRatingPage /></ErrorBoundary></Protected>} />
        <Route path="/dsa/round"         element={<Protected><ErrorBoundary><DSARoundPage /></ErrorBoundary></Protected>} />
        <Route path="/settings"          element={<Protected><ErrorBoundary><SettingsPage /></ErrorBoundary></Protected>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
