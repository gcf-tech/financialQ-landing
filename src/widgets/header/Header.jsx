import { useState } from 'react'
import './Header.css'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import logoImg from '../../assets/images/header/logo_financialQ.png'

const SOBRE_SUBS = ['firma', 'mision', 'governance']
const ENFOQUE_SUBS = ['filosofia', 'framework', 'proceso', 'riesgo']

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useTranslation()
  const tn = t.nav
  const navigate = useAppNavigate()

  const go = (page, sub) => {
    navigate(page, sub)
    setMenuOpen(false)
  }

  return (
    <nav id="mainNav">
      <div className="nav-inner">
        <div className="logo" onClick={() => go('inicio')}>
          <img src={logoImg} alt={t.common.logoName} className="logo-img" />
        </div>

        <ul className={`nav-menu${menuOpen ? ' open' : ''}`}>
          <li className="nav-item">
            <div className="nav-link" onClick={() => go('sobre')}>
              {tn.sobre}{' '}
              <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l4 4 4-4" />
              </svg>
            </div>
            <div className="nav-drop wide">
              {tn.dropdown.sobre.filter((_, i) => i !== 1).map((item, i) => (
                <div key={i} className="drop-item" onClick={() => go('sobre', SOBRE_SUBS[i])}>
                  <span className="drop-title">{item.title}</span>
                  <span className="drop-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </li>

          <li className="nav-item">
            <div className="nav-link" onClick={() => go('enfoque')}>
              {tn.enfoque}{' '}
              <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l4 4 4-4" />
              </svg>
            </div>
            <div className="nav-drop wide">
              {tn.dropdown.enfoque.slice(0, ENFOQUE_SUBS.length).map((item, i) => (
                <div key={i} className="drop-item" onClick={() => go('enfoque', ENFOQUE_SUBS[i])}>
                  <span className="drop-title">{item.title}</span>
                  <span className="drop-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </li>

          <li className="nav-item">
            <div className="nav-link" onClick={() => go('clientes')}>
              {tn.clientes}{' '}
              <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l4 4 4-4" />
              </svg>
            </div>
            <div className="nav-drop">
              {tn.dropdown.clientes.map((label, i) => (
                <div key={i} className="drop-item" onClick={() => go('clientes')}>
                  <span className="drop-title">{label}</span>
                </div>
              ))}
            </div>
          </li>

          <li className="nav-item">
            <div className="nav-link" onClick={() => go('perspectivas')}>{tn.perspectivas}</div>
          </li>

          <li>
            <div className="nav-cta" onClick={() => go('contacto')}>{tn.cta}</div>
          </li>
        </ul>

        <button className="burger" onClick={() => setMenuOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
