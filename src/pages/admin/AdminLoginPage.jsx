import { useState } from 'react'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useAdminSession } from '../../shared/lib/useAdminSession'
import {
  login,
  verifyOtp,
  logout,
  changePassword,
  forgotPassword,
} from '../../shared/api/auth'
import './ui/adminPages.css'

/**
 * Login del editor de Perspectives. Ruta discreta (/admin), sin variante por
 * idioma. Además del paso OTP opcional del backend, gestiona:
 *  - cambio obligatorio de contraseña en el primer ingreso (must_change_password),
 *  - "olvidé mi contraseña" (envía el enlace de reset por correo).
 */
export function AdminLoginPage() {
  const { t } = useTranslation()
  const ta = t.admin.login
  const navigate = useAppNavigate()
  const { isAdmin, name, mustChangePassword } = useAdminSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentInput, setCurrentInput] = useState('')
  const [step, setStep] = useState('credentials') // credentials | otp | forgot | forgotSent
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  // Si venimos del login tenemos la contraseña temporal en estado; si el
  // usuario recargó estando logueado, hay que pedírsela.
  const needsCurrent = !password

  const failMessage = err =>
    err.message === 'NOT_ADMIN' ? ta.notAdmin : ta.error

  const goToForgot = () => {
    setStep('forgot')
    setError('')
  }

  const goToLogin = () => {
    setStep('credentials')
    setError('')
  }

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
      } else if (result.mustChangePassword) {
        // La sesión ya quedó activa; el render muestra el cambio obligatorio.
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

  const handleForgot = async e => {
    e.preventDefault()
    if (status === 'loading' || !email.trim()) return
    setStatus('loading')
    setError('')
    try {
      await forgotPassword(email.trim())
      setStep('forgotSent')
      setStatus('idle')
    } catch {
      setError(ta.error)
      setStatus('idle')
    }
  }

  const handleChange = async e => {
    e.preventDefault()
    if (status === 'loading') return
    if (newPassword.length < 8) {
      setError(ta.tooShort)
      return
    }
    if (newPassword !== confirmPassword) {
      setError(ta.mismatch)
      return
    }
    const current = password || currentInput
    if (!current) {
      setError(ta.changeError)
      return
    }
    setStatus('loading')
    setError('')
    try {
      await changePassword(current, newPassword)
      // Re-login para dejar una sesión fresca (el cambio revoca los refresh
      // tokens). Si falla, el access token vigente sigue sirviendo.
      if (email.trim()) {
        try {
          await login(email.trim(), newPassword)
        } catch {
          /* noop */
        }
      }
      navigate('perspectivas')
    } catch {
      setError(ta.changeError)
      setStatus('idle')
    }
  }

  const heading =
    isAdmin && mustChangePassword
      ? ta.changeTitle
      : step === 'forgot' || step === 'forgotSent'
        ? ta.forgotTitle
        : ta.title

  return (
    <div>
      {/* data-clarity-mask: Clarity no puede detenerse una vez cargado, así que
          si el usuario llega aquí navegando desde una página pública el tag ya
          está corriendo. Esto impide que se suba el contenido. Ver
          shared/lib/clarity.js. */}
      <section className="s-admin" data-clarity-mask="true">
        <div className="wrap admin-wrap">
          <span className="eyebrow">{ta.eyebrow}</span>
          <h1 className="admin-title">{heading}</h1>

          {isAdmin && mustChangePassword ? (
            <form className="admin-card" onSubmit={handleChange} noValidate>
              <p className="admin-session-note">{ta.changeIntro}</p>
              {needsCurrent && (
                <>
                  <label className="admin-label" htmlFor="ch-current">{ta.currentPasswordLabel}</label>
                  <input
                    id="ch-current"
                    className="admin-input"
                    type="password"
                    autoComplete="current-password"
                    value={currentInput}
                    onChange={e => setCurrentInput(e.target.value)}
                  />
                </>
              )}
              <label className="admin-label" htmlFor="ch-new">{ta.newPasswordLabel}</label>
              <input
                id="ch-new"
                className="admin-input"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <label className="admin-label" htmlFor="ch-confirm">{ta.confirmPasswordLabel}</label>
              <input
                id="ch-confirm"
                className="admin-input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              {error && <p className="admin-error">{error}</p>}
              <div className="admin-actions-row">
                <Button variant="solid" onClick={handleChange}>
                  {status === 'loading' ? ta.changeSaving : ta.changeSubmit}
                </Button>
              </div>
            </form>
          ) : isAdmin ? (
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
          ) : step === 'otp' ? (
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
          ) : step === 'forgot' ? (
            <form className="admin-card" onSubmit={handleForgot} noValidate>
              <p className="admin-session-note">{ta.forgotIntro}</p>
              <label className="admin-label" htmlFor="fp-email">{ta.emailLabel}</label>
              <input
                id="fp-email"
                className="admin-input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {error && <p className="admin-error">{error}</p>}
              <div className="admin-actions-row">
                <Button variant="solid" onClick={handleForgot}>
                  {status === 'loading' ? ta.sending : ta.forgotSubmit}
                </Button>
                <Button variant="ghost" onClick={goToLogin}>
                  {ta.backToLogin}
                </Button>
              </div>
            </form>
          ) : step === 'forgotSent' ? (
            <div className="admin-card">
              <p className="admin-session-note">{ta.forgotSent}</p>
              <div className="admin-actions-row">
                <Button variant="solid" onClick={goToLogin}>
                  {ta.backToLogin}
                </Button>
              </div>
            </div>
          ) : (
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
              <button type="button" className="admin-linkbtn" onClick={goToForgot}>
                {ta.forgotLink}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
