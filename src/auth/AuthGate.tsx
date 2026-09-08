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
import {
  clearGuestSession,
  clearLockout,
  getGuestSession,
  type AuthRole,
} from './session'
import { LoginScreen } from './LoginScreen'
import { BootSequence } from './BootSequence'

interface AuthContextValue {
  user: User | null
  role: AuthRole
  isGuest: boolean
  isAdmin: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface Props {
  children: ReactNode
}

export function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [guest, setGuest] = useState(() => getGuestSession())
  const [ready, setReady] = useState(false)
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next)
      if (next) {
        clearGuestSession()
        setGuest(false)
      }
      setReady(true)
    })
    return () => unsub()
  }, [])

  // Re-check guest when LoginScreen sets session (custom event)
  useEffect(() => {
    const onGuest = () => setGuest(getGuestSession())
    window.addEventListener('sangaku-guest', onGuest)
    return () => window.removeEventListener('sangaku-guest', onGuest)
  }, [])

  const logout = useCallback(async () => {
    clearLockout()
    clearGuestSession()
    setGuest(false)
    if (auth.currentUser) {
      await signOut(auth)
    }
  }, [])

  const role: AuthRole | null = user ? 'admin' : guest ? 'guest' : null

  const value = useMemo(
    () =>
      role
        ? {
            user,
            role,
            isGuest: role === 'guest',
            isAdmin: role === 'admin',
            logout,
          }
        : null,
    [user, role, logout],
  )

  if (!booted) {
    return <BootSequence onDone={() => setBooted(true)} />
  }

  if (!ready) {
    return (
      <div className="gate-boot">
        <div className="grain" aria-hidden />
        <p className="boot-label">算額 · abriendo el portal…</p>
      </div>
    )
  }

  if (!role || !value) {
    return <LoginScreen />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthGate')
  return ctx
}
