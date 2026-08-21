import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { PageHero } from '../../shared/ui/pageHero/PageHero'
import { SocialLinks } from '../../shared/ui/socialLinks/SocialLinks'
import { submitContact } from '../../shared/api/contact'
import { GHL_OPTION_VALUES } from '../../shared/config/ghlFields'
import './ContactoPage.css'

const CALENDAR_ICON = (
  <svg className="consult-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
)

// Agenda externa de Calendly. Su idioma y branding se configuran en la cuenta
// de Calendly, no aquí: el iframe es cross-origin.
const CONSULT_URL = 'https://calendly.com/denciso-financialqgroup/30min'

function ConsultModal({ open, onClose, title }) {
  useEffect(() => {
    if (!open) return
    // Bloquear el scroll del fondo mientras el modal está abierto.
    document.body.style.overflow = 'hidden'
  const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="consult-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="consult-modal" onClick={e => e.stopPropagation()}>
        <button className="consult-close" onClick={onClose} aria-label="Close">&times;</button>
        <iframe className="consult-frame" src={CONSULT_URL} title={title} />
      </div>
    </div>
  )
}

const CONTACT_ICONS = {
  office: <svg className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2C6.68 2 4 4.68 4 8c0 5.25 6 10 6 10s6-4.75 6-10c0-3.32-2.68-6-6-6z" /><circle cx="10" cy="8" r="2" /></svg>,
  email: <svg className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h16v12H2z" /><path d="M2 4l8 8 8-8" /></svg>,
  phone: <svg className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4a1 1 0 011-1h2.5l1 3-1.5 1.5A11 11 0 0012 13.5l1.5-1.5 3 1V15a1 1 0 01-1 1C7.16 16 3 11.84 3 5V4z" /></svg>,
  hours: <svg className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 2" /></svg>,
  meeting: <svg className="ci-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="16" height="14" rx="1" /><path d="M2 7h16M7 3v4M13 3v4" /></svg>,
}

// El agendamiento NO depende del formulario. Antes el botón solo se activaba
// tras un envío correcto ("Please complete and submit the inquiry form to
// unlock scheduling"), así que todos los CTA del sitio decían "Schedule a
// Consultation" y ninguno agendaba: llevaban a un formulario que había que
// completar y enviar primero. Son dos caminos distintos hacia la firma y
// ninguno es requisito del otro.
function ContactInfo({ ti, onSchedule }) {
  const CONTACT_ITEMS = [
    { icon: 'office', label: ti.officeLabel, line1: ti.officeLine1, line2: ti.officeLine2 },
  //   { icon: 'email', label: ti.emailLabel, line1: ti.emailLine1, /*line2: ti.emailLine2 */},
  //   { icon: 'phone', label: ti.phoneLabel, line1: ti.phoneLine1, line2: ti.phoneLine2 },
    { icon: 'hours', label: ti.hoursLabel, line1: ti.hoursLine1, line2: ti.hoursLine2 },
    { icon: 'meeting', label: ti.meetingLabel, line1: ti.meetingLine1, line2: ti.meetingLine2 }
  ]

  return (
    <div>
     <span className="eyebrow" style={{ marginBottom: 24, display: 'flex' }}>{ti.eyebrow}</span>
      <div>
        {CONTACT_ITEMS.map(item => (
          <div key={item.label} className="ci-item">
            {CONTACT_ICONS[item.icon]}
            <div>
              <div className="ci-label">{item.label}</div>
              <div className="ci-val">{item.line1}<br />{item.line2}</div>
            </div>
          </div>
        ))}
      </div> 

      <div className="consult-card">
        {CALENDAR_ICON}
        <h3 className="consult-title">{ti.consultTitle}</h3>
        <span className="consult-divider" />
        <p className="consult-text">{ti.consultText}</p>
        <Button variant="solid" onClick={onSchedule}>
          {ti.consultBtn}
        </Button>
      </div>

      <div className="ci-social">
        <span className="ci-social-label">{ti.socialLabel}</span>
        <SocialLinks className="ci-social-links" />
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
  income: '',
  referral: '',
  situation: '',
  // Atribución de origen: de dónde venía quien abrió este formulario. No lo
  // rellena la persona, lo trae el query string (?source=post-<slug>) que pone
  // el bloque de cierre de un artículo. Vacío en una visita directa a /contacto.
  source: '',
}

// Los campos que viven dentro del bloque plegable. Se nombran aparte porque
// hacen falta dos veces: para exigirlos y para saber si un error de validación
// cayó dentro de una sección que el usuario no está viendo.
const DETAILS_FIELDS = ['company', 'profile', 'assets', 'income', 'referral']

// Por decisión editorial el formulario se envía completo: no hay campo que se
// pueda dejar en blanco. Eso incluye los dos financieros —activos invertibles
// e ingreso del hogar—, que se piden a personas que todavía no son clientes.
// La salida de quien no quiera darlos NO es dejarlos vacíos, es elegir la
// opción explícita de cada desplegable («Prefiero no decirlo» / «Otro»): así
// la negativa llega al CRM como un dato y no como un hueco indistinguible de
// un formulario abandonado a medias.
//
// `source` queda fuera a propósito: no lo rellena nadie, lo trae el query
// string, y está vacío en una visita directa a /contacto.
const REQUIRED = ['firstName', 'lastName', 'email', 'situation', ...DETAILS_FIELDS]
const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function isFieldInvalid(field, value) {
  if (REQUIRED.includes(field) && !value.trim()) return true
  if (field === 'email' && value.trim() && !isValidEmail(value)) return true
  return false
}

export function ContactoPage() {
  useScrollReveal()
  const [searchParams] = useSearchParams()
  const { t, lang } = useTranslation()
  const tc = t.contacto
  const tf = tc.form
  const ti = tc.info

  // Se lee una sola vez, al montar: se llega aquí desde otra ruta, así que el
  // query string ya está puesto en el primer render. Nada dentro de /contacto
  // reescribe el `source`, y sincronizarlo después obligaría a mutar estado en
  // un efecto para un caso que no ocurre.
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    source: searchParams.get('source') || '',
  }))
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [consultOpen, setConsultOpen] = useState(false)

  // Se abre el bloque plegable desde aquí cuando el envío falla por un campo
  // que está dentro. Es un ref y no estado: `<details>` sigue siendo nativo y
  // sin atributo `open`, así que el HTML pre-renderizado no cambia y la
  // sección sigue funcionando con JS deshabilitado.
  const detailsRef = useRef(null)

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
    if (hasErrors) {
      // Un error señalado sobre un campo plegado no se puede corregir: se ve
      // el aviso y no el campo que lo causa.
      if (DETAILS_FIELDS.some(f => isFieldInvalid(f, form[f])) && detailsRef.current) {
        detailsRef.current.open = true
      }
      return
    }

    setSubmitted(false)
    setStatus('loading')
    try {
      await submitContact(form, lang)
      setStatus('success')
      setForm({ ...EMPTY_FORM, source: form.source })
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
                  {/* Atribución de origen. Campo oculto y no un valor suelto
                      del componente: así viaja con el resto del formulario y
                      se ve en el DOM al depurar de dónde vino un envío.
                      `readOnly` porque nadie lo edita — sin él React avisa de
                      un input controlado sin onChange. */}
                  <input type="hidden" name="source" value={form.source} readOnly />
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
                  {/* Descripción libre. Es el campo que de verdad permite
                      responder con criterio, y lo escribe quien contacta con el
                      nivel de detalle que quiera dar. */}
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

                  {/* El resto de campos, agrupado y plegado para no abrumar de
                      entrada. Plegado no quiere decir opcional: todos se exigen
                      (ver REQUIRED), y si el envío falla por alguno de ellos la
                      sección se abre sola para que el error sea visible.
                      <details> nativo: sin JS, accesible por teclado y presente
                      en el HTML pre-renderizado. */}
                  <details className="fdetails" ref={detailsRef}>
                    <summary className="fdetails-summary">
                      <span>{tf.optionalTitle}</span>
                      <svg className="fdetails-caret" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </summary>

                    <p className="fdetails-hint">{tf.optionalHint}</p>

                    <div className="fgroup">
                      <label className="flabel">{tf.labelCompany}</label>
                      <input
                        className={`finput ${ec('company')}`}
                        type="text"
                        placeholder={tf.placeholderCompany}
                        value={form.company}
                        onChange={set('company')}
                        onBlur={touch('company')}
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
                        <option value="">{tf.placeholderProfile}</option>
                        {tf.profileOptions.map((opt, i) => <option key={opt} value={GHL_OPTION_VALUES.profile[i]}>{opt}</option>)}
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
                        <option value="">{tf.placeholderAssets}</option>
                        {tf.assetOptions.map((opt, i) => <option key={opt} value={GHL_OPTION_VALUES.assets[i]}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="fgroup">
                      <label className="flabel">{tf.labelIncome}</label>
                      <select
                        className={`fselect ${ec('income')}`}
                        value={form.income}
                        onChange={set('income')}
                        onBlur={touch('income')}
                      >
                        <option value="">{tf.placeholderIncome}</option>
                        {tf.incomeOptions.map((opt, i) => <option key={opt} value={GHL_OPTION_VALUES.income[i]}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="fgroup">
                      <label className="flabel">{tf.labelReferral}</label>
                      <select
                        className={`fselect ${ec('referral')}`}
                        value={form.referral}
                        onChange={set('referral')}
                        onBlur={touch('referral')}
                      >
                        <option value="">{tf.placeholderReferral}</option>
                        {tf.referralOptions.map((opt, i) => <option key={opt} value={GHL_OPTION_VALUES.referral[i]}>{opt}</option>)}
                      </select>
                    </div>
                  </details>
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
            <ContactInfo ti={ti} onSchedule={() => setConsultOpen(true)} />
          </div>
        </div>
      </section>

      <ConsultModal open={consultOpen} onClose={() => setConsultOpen(false)} title={ti.consultTitle} />

      <Footer variant="full" />
    </div>
  )
}
