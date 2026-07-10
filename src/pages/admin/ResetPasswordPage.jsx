import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { resetPassword } from '../../shared/api/auth'
import './ui/adminPages.css'

/**
 * Página de "restablecer contraseña". Se llega desde el enlace del correo
 * (SITE_URL/reset-password?token=...). Ruta única, sin variante por idioma.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const tr = t.admin.reset
  const navigate = useAppNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (status === 'loading') return
    if (newPassword.length < 8) {
      setError(tr.tooShort)
      return
    }
    if (newPassword !== confirmPassword) {
      setError(tr.mismatch)
      return
    }
    setStatus('loading')
    setError('')
    try {
      await resetPassword(token, newPassword)
      setStatus('done')
    } catch {
      setError(tr.error)
      setStatus('idle')
    }
  }

  return (
    <div>
      <section className="s-admin">
        <div className="wrap admin-wrap">
          <span className="eyebrow">{tr.eyebrow}</span>
          <h1 className="admin-title">{tr.title}</h1>

          {!token ? (
            <div className="admin-card">
              <p className="admin-error">{tr.missingToken}</p>
              <div className="admin-actions-row">
                <Button variant="solid" onClick={() => navigate('admin')}>
                  {tr.goToLogin}
                </Button>
              </div>
            </div>
          ) : status === 'done' ? (
            <div className="admin-card">
              <p className="admin-session-note">{tr.success}</p>
              <div className="admin-actions-row">
                <Button variant="solid" onClick={() => navigate('admin')}>
                  {tr.goToLogin}
                </Button>
              </div>
            </div>
          ) : (
            <form className="admin-card" onSubmit={handleSubmit} noValidate>
              <label className="admin-label" htmlFor="rp-new">{tr.newPasswordLabel}</label>
              <input
                id="rp-new"
                className="admin-input"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <label className="admin-label" htmlFor="rp-confirm">{tr.confirmPasswordLabel}</label>
              <input
                id="rp-confirm"
                className="admin-input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              {error && <p className="admin-error">{error}</p>}
              <div className="admin-actions-row">
                <Button variant="solid" onClick={handleSubmit}>
                  {status === 'loading' ? tr.sending : tr.submit}
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
