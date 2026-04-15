import { useState } from 'react'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { PageHero } from '../../shared/ui/pageHero/PageHero'
import { submitContact } from '../../shared/api/contact'

const CONTACT_ICONS = [
  <svg key="office" className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2C6.68 2 4 4.68 4 8c0 5.25 6 10 6 10s6-4.75 6-10c0-3.32-2.68-6-6-6z" /><circle cx="10" cy="8" r="2" /></svg>,
  <svg key="email" className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h16v12H2z" /><path d="M2 4l8 8 8-8" /></svg>,
  <svg key="phone" className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4a1 1 0 011-1h2.5l1 3-1.5 1.5A11 11 0 0012 13.5l1.5-1.5 3 1V15a1 1 0 01-1 1C7.16 16 3 11.84 3 5V4z" /></svg>,
  <svg key="meeting" className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="16" height="14" rx="1" /><path d="M2 7h16M7 3v4M13 3v4" /></svg>,
]

function ContactInfo({ ti }) {
  const CONTACT_ITEMS = [
    { label: ti.officeLabel, line1: ti.officeLine1, line2: ti.officeLine2 },
    { label: ti.emailLabel, line1: ti.emailLine1, /*line2: ti.emailLine2 */},
    { label: ti.phoneLabel, line1: ti.phoneLine1, line2: ti.phoneLine2 },
    { label: ti.meetingLabel, line1: ti.meetingLine1, line2: ti.meetingLine2 },
  ]

  return (
    <div>
      <span className="eyebrow" style={{ marginBottom: 24, display: 'flex' }}>{ti.eyebrow}</span>
      <div>
        {CONTACT_ITEMS.map((item, i) => (
          <div key={item.label} className="ci-item">
            {CONTACT_ICONS[i]}
            <div>
              <div className="ci-label">{item.label}</div>
              <div className="ci-val">{item.line1}<br />{item.line2}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  profile: '',
  assets: '',
  situation: '',
}

const REQUIRED = ['firstName', 'lastName', 'email', 'profile', 'assets', 'situation']
const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function isFieldInvalid(field, value) {
  if (REQUIRED.includes(field) && !value.trim()) return true
  if (field === 'email' && value.trim() && !isValidEmail(value)) return true
  return false
}

export function ContactoPage() {
  useScrollReveal()
  const { t, lang } = useTranslation()
  const tc = t.contacto
  const tf = tc.form
  const ti = tc.info

  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  const fieldErrors = Object.fromEntries(
    Object.keys(form)
      .filter(f => touched[f] && isFieldInvalid(f, form[f]))
      .map(f => [f, true])
  )

  const showValidationBanner = submitted && Object.keys(fieldErrors).length > 0

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  const touch = field => () => setTouched(prev => ({ ...prev, [field]: true }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (status === 'loading') return
    setTouched(Object.fromEntries(REQUIRED.map(f => [f, true])))
    setSubmitted(true)
    const hasErrors = REQUIRED.some(f => isFieldInvalid(f, form[f]))
    if (hasErrors) return

    setSubmitted(false)
    setStatus('loading')
    try {
      await submitContact(form, lang)
      setStatus('success')
      setForm(EMPTY_FORM)
      setTouched({})
    } catch {
      setStatus('error')
    }
  }

  const ec = field => fieldErrors[field] ? 'error' : ''

  return (
    <div>
      <PageHero kicker={tc.kicker} heading={tc.heading} headingItalic={tc['heading.italic']} />

      <section className="section">
        <div className="wrap">
          <div className="col2 eq reveal">
            {/* Formulario */}
            <div>
              {status === 'success' ? (
                <div>
                  <span className="eyebrow" style={{ marginBottom: 24, display: 'flex' }}>{tf.eyebrow}</span>
                  <div className="fbanner success" style={{ marginBottom: 0, padding: '32px 24px' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{tf.successTitle}</div>
                    <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.65 }}>{tf.successBody}</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <span className="eyebrow" style={{ marginBottom: 24, display: 'flex' }}>{tf.eyebrow}</span>
                  <p className="body-copy" style={{ fontSize: 15, marginBottom: 32 }}>{tf.intro}</p>

                  {showValidationBanner && (
                    <div className="fbanner error">{tf.errorRequired}</div>
                  )}
                  {status === 'error' && (
                    <div className="fbanner error">{tf.errorSubmit}</div>
                  )}

                  <div className="f2">
                    <div className="fgroup">
                      <label className="flabel">{tf.labelName}</label>
                      <input
                        className={`finput ${ec('firstName')}`}
                        type="text"
                        placeholder={tf.placeholderName}
                        value={form.firstName}
                        onChange={set('firstName')}
                        onBlur={touch('firstName')}
                      />
                    </div>
                    <div className="fgroup">
                      <label className="flabel">{tf.labelLastName}</label>
                      <input
                        className={`finput ${ec('lastName')}`}
                        type="text"
                        placeholder={tf.placeholderLastName}
                        value={form.lastName}
                        onChange={set('lastName')}
                        onBlur={touch('lastName')}
                      />
                    </div>
                  </div>

                  <div className="fgroup">
                    <label className="flabel">{tf.labelEmail}</label>
                    <input
                      className={`finput ${ec('email')}`}
                      type="email"
                      placeholder={tf.placeholderEmail}
                      value={form.email}
                      onChange={set('email')}
                      onBlur={touch('email')}
                    />
                  </div>

                  <div className="fgroup">
                    <label className="flabel">{tf.labelCompany}</label>
                    <input
                      className="finput"
                      type="text"
                      placeholder={tf.placeholderCompany}
                      value={form.company}
                      onChange={set('company')}
                    />
                  </div>

                  <div className="fgroup">
                    <label className="flabel">{tf.labelProfile}</label>
                    <select
                      className={`fselect ${ec('profile')}`}
                      value={form.profile}
                      onChange={set('profile')}
                      onBlur={touch('profile')}
                    >
                      <option value="" disabled>{tf.placeholderProfile}</option>
                      {tf.profileOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="fgroup">
                    <label className="flabel">{tf.labelAssets}</label>
                    <select
                      className={`fselect ${ec('assets')}`}
                      value={form.assets}
                      onChange={set('assets')}
                      onBlur={touch('assets')}
                    >
                      <option value="" disabled>{tf.placeholderAssets}</option>
                      {tf.assetOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="fgroup">
                    <label className="flabel">{tf.labelSituation}</label>
                    <textarea
                      className={`ftextarea ${ec('situation')}`}
                      placeholder={tf.placeholderSituation}
                      value={form.situation}
                      onChange={set('situation')}
                      onBlur={touch('situation')}
                    />
                  </div>

                  <div style={{ marginTop: 4 }}>
                    <Button
                      variant="solid"
                      onClick={handleSubmit}
                      style={{
                        width: '100%', textAlign: 'center', padding: 16,
                        opacity: status === 'loading' ? 0.6 : 1,
                        pointerEvents: status === 'loading' ? 'none' : 'auto',
                      }}
                    >
                      {status === 'loading' ? '...' : tf.btnSubmit}
                    </Button>
                    <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--muted)', marginTop: 12, lineHeight: 1.65 }}>{tf.privacy}</p>
                  </div>
                </form>
              )}
            </div>

            {/* Info lateral */}
            <ContactInfo ti={ti} />
          </div>
        </div>
      </section>

      <Footer variant="full" />
    </div>
  )
}
