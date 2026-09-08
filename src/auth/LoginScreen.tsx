import { useEffect, useState, type FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { motion } from 'framer-motion'
import { auth } from '../firebase'
import { LoginBackground } from './LoginBackground'
import {
  AUTH_EMAIL,
  LOCKOUT_MS,
  MAX_ATTEMPTS,
  clearLockout,
  getFailCount,
  getLockoutUntil,
  isExpectedUsername,
  resetFailCount,
  setFailCount,
  setLockoutUntil,
} from './session'

export function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutUntil, setLockoutUntilState] = useState(() => getLockoutUntil())
  const [now, setNow] = useState(() => Date.now())

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (locked || loading) return
    setError('')
    setLoading(true)

    try {
      if (!isExpectedUsername(username)) {
        registerFailure()
        return
      }

      await signInWithEmailAndPassword(auth, AUTH_EMAIL, password)
      resetFailCount()
      clearLockout()
      setLockoutUntilState(0)
    } catch (err) {
      if (err instanceof FirebaseError) {
        const code = err.code
        if (
          code === 'auth/configuration-not-found' ||
          code === 'auth/operation-not-allowed'
        ) {
          setError(
            'Authentication no está listo. En Firebase Console: habilita Email/Password y crea el usuario sheol@sangaku.app. Añade el dominio autorizado srsheol.github.io.',
          )
          return
        }
        if (
          code === 'auth/wrong-password' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-email'
        ) {
          registerFailure()
          return
        }
      }
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="torii-mark" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p className="gate-kicker">門 · cerrado</p>
          <h1 className="gate-title">El sello permanece</h1>
          <p className="gate-msg">
            Demasiados intentos inválidos.
            <br />
            El portal se reabre en breve.
          </p>
          <p className="lockout-countdown">{String(remainingSec).padStart(2, '0')}s</p>
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
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="torii-mark" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="login-brand">
          <p className="gate-kicker">算額 · temple tablet</p>
          <h1 className="gate-title">Sangaku</h1>
          <p className="gate-sub">Pendientes · sello de acceso</p>
        </div>

        <div className="field">
          <label htmlFor="sangaku-user">Usuario</label>
          <input
            id="sangaku-user"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            placeholder="Sheol"
          />
        </div>

        <div className="field">
          <label htmlFor="sangaku-pass">Contraseña</label>
          <input
            id="sangaku-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="btn-seal" disabled={loading}>
          {loading ? 'Verificando sello…' : 'Abrir el portal'}
        </button>

        <p className="gate-footer">Juan Manuel Saucedo Rosas · badge 9</p>
      </motion.form>
    </div>
  )
}
