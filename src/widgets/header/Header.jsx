import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import './Header.css'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useAdminSession } from '../../shared/lib/useAdminSession'
import { logout } from '../../shared/api/auth'
import { SLUG_TO_KEY } from '../../shared/config/routes'
import logoImg from '../../assets/images/header/logo_financialQ.png'

const SOBRE_SUBS = ['firma', 'mision', 'governance']
const ENFOQUE_SUBS = ['filosofia', 'framework', 'proceso', 'riesgo']

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const [userOpen, setUserOpen] = useState(false)
  const { t, lang } = useTranslation()
  const tn = t.nav
  const navigate = useAppNavigate()
  const location = useLocation()
  const { isAdmin, name } = useAdminSession()
  const userRef = useRef(null)

  // Clave interna de la sección activa según el primer segmento de la URL,
  // para resaltar el ítem del navbar de la página en la que está el usuario.
  const firstSeg = location.pathname.split('/').filter(Boolean)[0]
  const activeKey = SLUG_TO_KEY[lang]?.[firstSeg] ?? null

  useEffect(() => {
    setMenuOpen(false)
    setOpenDrop(null)
    setUserOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!userOpen) return
    // Ignorar clicks dentro del propio menú: el mismo click que abre puede
    // alcanzar este listener al burbujear hasta document y cerrarlo al instante.
    const close = e => {
      if (userRef.current?.contains(e.target)) return
      setUserOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [userOpen])

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

  const userIcon = (
    <svg className="nav-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )

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

        <div className="nav-right">
        <ul className={`nav-menu${menuOpen ? ' open' : ''}`}>
          <li className={`nav-item${openDrop === 0 ? ' expanded' : ''}`}>
            <div className={`nav-link${activeKey === 'sobre' ? ' active' : ''}`} onClick={() => go('sobre')}>
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
            <div className={`nav-link${activeKey === 'enfoque' ? ' active' : ''}`} onClick={() => go('enfoque')}>
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
            <div className={`nav-link${activeKey === 'clientes' ? ' active' : ''}`} onClick={() => go('clientes')}>
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
            <div className={`nav-link${activeKey === 'perspectivas' ? ' active' : ''}`} onClick={() => go('perspectivas')}>
              <span className="nav-link-text">{tn.perspectivas}</span>
            </div>
          </li>

          <li className="nav-item-cta">
            <div className="nav-cta" onClick={() => go('contacto')}>{tn.cta}</div>
          </li>
        </ul>

        {isAdmin ? (
          <div ref={userRef} className={`nav-user${userOpen ? ' open' : ''}`}>
            <button
              type="button"
              className="nav-user-btn"
              onClick={() => { setUserOpen(o => !o); setMenuOpen(false) }}
              aria-haspopup="true"
              aria-expanded={userOpen}
            >
              {userIcon}
              <span className="nav-user-name">{name || tn.admin}</span>
              <svg className="nav-user-caret" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l4 4 4-4" />
              </svg>
            </button>
            <div className="nav-user-drop">
              <span className="nav-user-session">{name || tn.admin}</span>
              <button
                type="button"
                className="nav-user-logout"
                onClick={() => { logout(); setUserOpen(false) }}
              >
                {t.admin.login.logout}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="nav-user-btn"
            onClick={() => go('admin')}
            aria-label={tn.login}
            title={tn.login}
          >
            {userIcon}
          </button>
        )}

        <button
          type="button"
          className={`burger${menuOpen ? ' open' : ''}`}
          onClick={() => { setMenuOpen(o => !o); setUserOpen(false) }}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
        </div>
      </div>
    </nav>
  )
}
