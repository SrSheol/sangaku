import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from '../firebase'
import { clearLockout } from './session'
import { LoginScreen } from './LoginScreen'

interface AuthContextValue {
  user: User
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface Props {
  children: ReactNode
}

export function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next)
      setReady(true)
    })
    return () => unsub()
  }, [])

  const logout = useCallback(async () => {
    clearLockout()
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => (user ? { user, logout } : null),
    [user, logout],
  )

  if (!ready) {
    return (
      <div className="gate-boot">
        <div className="grain" aria-hidden />
        <p className="boot-label">算額 · abriendo el portal…</p>
      </div>
    )
  }

  if (!user || !value) {
    return <LoginScreen />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthGate')
  return ctx
}
