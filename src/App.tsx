import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './auth/AuthGate'
import { Dashboard } from './components/Dashboard'
import { InkFilters } from './components/ui/InkAssets'

export default function App() {
  return (
    <>
      <InkFilters />
      <HashRouter>
        <AuthGate>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGate>
      </HashRouter>
    </>
  )
}
