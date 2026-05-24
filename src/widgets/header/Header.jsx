import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Header.css'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import logoImg from '../../assets/images/header/logo_financialQ.png'

const SOBRE_SUBS = ['firma', 'mision', 'governance']
const ENFOQUE_SUBS = ['filosofia', 'framework', 'proceso', 'riesgo']

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const { t } = useTranslation()
  const tn = t.nav
  const navigate = useAppNavigate()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    setOpenDrop(null)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) {
      setOpenDrop(null)
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [menuOpen])

  const go = (page, sub) => {
    navigate(page, sub)
    setMenuOpen(false)
  }

  const toggleDrop = (e, idx) => {
    e.stopPropagation()
    setOpenDrop(prev => prev === idx ? null : idx)
  }

  const caret = (idx) => (
    <button
      type="button"
      className="nav-caret"
      onClick={(e) => toggleDrop(e, idx)}
      aria-label="Toggle submenu"
      aria-expanded={openDrop === idx}
    >
      <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 1l4 4 4-4" />
      </svg>
    </button>
  )

  return (
    <nav id="mainNav">
      <div className="nav-inner">
        <div className="logo" onClick={() => go('inicio')}>
          <img src={logoImg} alt={t.common.logoName} className="logo-img" />
        </div>

        <ul className={`nav-menu${menuOpen ? ' open' : ''}`}>
          <li className={`nav-item${openDrop === 0 ? ' expanded' : ''}`}>
            <div className="nav-link" onClick={() => go('sobre')}>
              <span className="nav-link-text">{tn.sobre}</span>
              {caret(0)}
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

          <li className={`nav-item${openDrop === 1 ? ' expanded' : ''}`}>
            <div className="nav-link" onClick={() => go('enfoque')}>
              <span className="nav-link-text">{tn.enfoque}</span>
              {caret(1)}
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

          <li className={`nav-item${openDrop === 2 ? ' expanded' : ''}`}>
            <div className="nav-link" onClick={() => go('clientes')}>
              <span className="nav-link-text">{tn.clientes}</span>
              {caret(2)}
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
            <div className="nav-link" onClick={() => go('perspectivas')}>
              <span className="nav-link-text">{tn.perspectivas}</span>
            </div>
          </li>

          <li className="nav-item-cta">
            <div className="nav-cta" onClick={() => go('contacto')}>{tn.cta}</div>
          </li>
        </ul>

        <button
          type="button"
          className={`burger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
