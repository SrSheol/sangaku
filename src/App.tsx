import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './auth/AuthGate'
import { Dashboard } from './components/Dashboard'

export default function App() {
  return (
    <HashRouter>
      <AuthGate>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGate>
    </HashRouter>
  )
}
