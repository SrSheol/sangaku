import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { motion } from 'framer-motion'
import { auth } from '../firebase'
import { SealMark, TornEdge } from '../components/ui/InkAssets'
import { LoginBackground } from './LoginBackground'
import {
  AUTH_EMAILS,
  LOCKOUT_MS,
  MAX_ATTEMPTS,
  clearLockout,
  getFailCount,
  getLockoutUntil,
  isExpectedUsername,
  isGuestPassword,
  isGuestUsername,
  resetFailCount,
  setFailCount,
  setGuestSession,
  setLockoutUntil,
} from './session'

function isCredentialError(code: string): boolean {
  return (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  )
}

export function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutUntil, setLockoutUntilState] = useState(() => getLockoutUntil())
  const [now, setNow] = useState(() => Date.now())
  const userRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)

  const locked = lockoutUntil > now
  const remainingSec = locked ? Math.max(0, Math.ceil((lockoutUntil - now) / 1000)) : 0

  useEffect(() => {
    if (!locked) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= lockoutUntil) {
        clearLockout()
        setLockoutUntilState(0)
        setError('')
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [locked, lockoutUntil])

  const registerFailure = (message = 'Acceso denegado') => {
    const next = getFailCount() + 1
    setFailCount(next)
    setError(message)
    if (next >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_MS
      setLockoutUntil(until)
      setLockoutUntilState(until)
      setUsername('')
      setPassword('')
    }
  }

  const focusGuestHint = () => {
    userRef.current?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (locked || loading) return
    setError('')
    setLoading(true)

    try {
      if (isGuestUsername(username)) {
        if (!isGuestPassword(password)) {
          registerFailure()
          return
        }
        setGuestSession()
        resetFailCount()
        clearLockout()
        setLockoutUntilState(0)
        window.dispatchEvent(new Event('sangaku-guest'))
        return
      }

      if (!isExpectedUsername(username)) {
        registerFailure()
        return
      }

      let lastErr: unknown = null
      let signedIn = false

      for (let i = 0; i < AUTH_EMAILS.length; i++) {
        const email = AUTH_EMAILS[i]
        try {
          await signInWithEmailAndPassword(auth, email, password)
          signedIn = true
          break
        } catch (err) {
          lastErr = err
          if (err instanceof FirebaseError) {
            const code = err.code
            if (
              code === 'auth/configuration-not-found' ||
              code === 'auth/operation-not-allowed'
            ) {
              setError(
                'Authentication no está listo. En Firebase Console: habilita Email/Password, crea el usuario de acceso y añade el dominio autorizado srsheol.github.io.',
              )
              return
            }
            if (
              (code === 'auth/user-not-found' || code === 'auth/invalid-credential') &&
              i < AUTH_EMAILS.length - 1
            ) {
              continue
            }
            if (isCredentialError(code)) {
              registerFailure()
              return
            }
          }
          registerFailure()
          return
        }
      }

      if (!signedIn) {
        if (lastErr instanceof FirebaseError && isCredentialError(lastErr.code)) {
          registerFailure()
        } else {
          registerFailure()
        }
        return
      }

      resetFailCount()
      clearLockout()
      setLockoutUntilState(0)
    } catch {
      registerFailure()
    } finally {
      setLoading(false)
    }
  }

  if (locked) {
    return (
      <div className="login-screen">
        <LoginBackground />
        <div className="grain" aria-hidden />
        <motion.div
          className="login-gate lockout-panel"
          role="alert"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <TornEdge />
          <div className="login-mark"><SealMark size={40} glyph="門" /></div>
          <p className="gate-kicker">門 · cerrado</p>
          <h1 className="gate-title">El sello permanece</h1>
          <p className="gate-editorial">Demasiados intentos inválidos</p>
          <p className="gate-msg">El portal se reabre en breve.</p>
          <p className="lockout-countdown">{String(remainingSec).padStart(2, '0')}s</p>
          <TornEdge flip />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="login-screen">
      <LoginBackground />
      <div className="grain" aria-hidden />
      <motion.form
        className="login-gate"
        onSubmit={(e) => void handleSubmit(e)}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
      >
        <TornEdge />
        <div className="login-brand">
          <div className="login-mark"><SealMark size={48} glyph="算" /></div>
          <p className="gate-kicker">算額 · Sangaku</p>
          <h1 className="gate-title">Sello de acceso</h1>
          <p className="gate-editorial">quiet path · 和</p>
        </div>

        <div className="field">
          <label htmlFor="sangaku-user">Usuario</label>
          <input
            ref={userRef}
            id="sangaku-user"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="field">
          <label htmlFor="sangaku-pass">Contraseña</label>
          <input
            ref={passRef}
            id="sangaku-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        <motion.button
          type="submit"
          className="btn-seal"
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? 'Verificando sello…' : 'Abrir el portal'}
        </motion.button>

        <p className="guest-hint">
          Acceso de invitado disponible ·{' '}
          <button type="button" className="guest-hint-link" onClick={focusGuestHint}>
            ¿Eres invitado?
          </button>
        </p>
        <TornEdge flip />
      </motion.form>
    </div>
  )
}
