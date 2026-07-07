import { useState } from 'react'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useAdminSession } from '../../shared/lib/useAdminSession'
import { login, verifyOtp, logout } from '../../shared/api/auth'
import './ui/adminPages.css'

/**
 * Login del editor de Perspectives. Ruta discreta (/admin), sin variante por
 * idioma. Soporta el segundo paso OTP que el backend puede exigir según su
 * configuración global.
 */
export function AdminLoginPage() {
  const { t } = useTranslation()
  const ta = t.admin.login
  const navigate = useAppNavigate()
  const { isAdmin, name } = useAdminSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [step, setStep] = useState('credentials')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const failMessage = err =>
    err.message === 'NOT_ADMIN' ? ta.notAdmin : ta.error

  const handleLogin = async e => {
    e.preventDefault()
    if (status === 'loading' || !email.trim() || !password) return
    setStatus('loading')
    setError('')
    try {
      const result = await login(email.trim(), password)
      if (result.status === 'OTP_REQUIRED') {
        setStep('otp')
        setStatus('idle')
      } else {
        navigate('perspectivas')
      }
    } catch (err) {
      setError(failMessage(err))
      setStatus('idle')
    }
  }

  const handleOtp = async e => {
    e.preventDefault()
    if (status === 'loading' || !otpCode.trim()) return
    setStatus('loading')
    setError('')
    try {
      await verifyOtp(email.trim(), otpCode.trim())
      navigate('perspectivas')
    } catch (err) {
      setError(failMessage(err))
      setStatus('idle')
    }
  }

  return (
    <div>
      <section className="s-admin">
        <div className="wrap admin-wrap">
          <span className="eyebrow">{ta.eyebrow}</span>
          <h1 className="admin-title">{ta.title}</h1>

          {isAdmin ? (
            <div className="admin-card">
              <p className="admin-session-note">
                {ta.sessionTitle}{name ? ` · ${name}` : ''}
              </p>
              <div className="admin-actions-row">
                <Button variant="solid" onClick={() => navigate('perspectivas')}>
                  {ta.goToPerspectives}
                </Button>
                <Button variant="ghost" onClick={() => logout()}>
                  {ta.logout}
                </Button>
              </div>
            </div>
          ) : step === 'credentials' ? (
            <form className="admin-card" onSubmit={handleLogin} noValidate>
              <label className="admin-label" htmlFor="admin-email">{ta.emailLabel}</label>
              <input
                id="admin-email"
                className="admin-input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <label className="admin-label" htmlFor="admin-password">{ta.passwordLabel}</label>
              <input
                id="admin-password"
                className="admin-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {error && <p className="admin-error">{error}</p>}
              <div className="admin-actions-row">
                <Button variant="solid" onClick={handleLogin}>
                  {status === 'loading' ? ta.sending : ta.submit}
                </Button>
              </div>
            </form>
          ) : (
            <form className="admin-card" onSubmit={handleOtp} noValidate>
              <p className="admin-session-note">{ta.otpTitle}</p>
              <label className="admin-label" htmlFor="admin-otp">{ta.otpLabel}</label>
              <input
                id="admin-otp"
                className="admin-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
              />
              {error && <p className="admin-error">{error}</p>}
              <div className="admin-actions-row">
                <Button variant="solid" onClick={handleOtp}>
                  {status === 'loading' ? ta.sending : ta.otpSubmit}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
