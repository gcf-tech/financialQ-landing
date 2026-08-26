import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import './Header.css'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate, useAppPath } from '../../shared/lib/useAppNavigate'
import { useAdminSession } from '../../shared/lib/useAdminSession'
import { logout } from '../../shared/api/auth'
import { SLUG_TO_KEY } from '../../shared/config/routes'
import logo1x from '../../assets/images/header/logo_financialQ-209w.webp'
import logo2x from '../../assets/images/header/logo_financialQ-418w.webp'

const SOBRE_SUBS = ['firma', 'mision', 'governance']
const ENFOQUE_SUBS = ['filosofia', 'framework', 'proceso', 'riesgo', 'presupuesto']

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const [userOpen, setUserOpen] = useState(false)
  const { t, lang } = useTranslation()
  const tn = t.nav
  const navigate = useAppNavigate()
  const href = useAppPath()
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

  /**
   * Handler para los enlaces del nav. El <a href> real existe para que los
   * crawlers descubran las páginas y para que ctrl/cmd/middle-click abran una
   * pestaña nueva; el click normal se intercepta y navega por el router.
   */
  const onNavClick = (page, sub) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    go(page, sub)
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
        <a className="logo" href={href('inicio')} onClick={onNavClick('inicio')}>
          <img
            src={logo1x}
            srcSet={`${logo1x} 1x, ${logo2x} 2x`}
            width="209"
            height="45"
            alt={t.common.logoAlt}
            className="logo-img"
          />
        </a>

        <div className="nav-right">
        <ul className={`nav-menu${menuOpen ? ' open' : ''}`}>
          <li className={`nav-item${openDrop === 0 ? ' expanded' : ''}`}>
            <div className={`nav-link${activeKey === 'sobre' ? ' active' : ''}`} onClick={onNavClick('sobre')}>
              <a className="nav-link-text" href={href('sobre')}>{tn.sobre}</a>
              {caret(0)}
            </div>
            <div className="nav-drop wide">
              {tn.dropdown.sobre.filter((_, i) => i !== 1).map((item, i) => (
                <a key={i} className="drop-item" href={href('sobre', SOBRE_SUBS[i])} onClick={onNavClick('sobre', SOBRE_SUBS[i])}>
                  <span className="drop-title">{item.title}</span>
                  <span className="drop-desc">{item.desc}</span>
                </a>
              ))}
            </div>
          </li>

          <li className={`nav-item${openDrop === 1 ? ' expanded' : ''}`}>
            <div className={`nav-link${activeKey === 'enfoque' ? ' active' : ''}`} onClick={onNavClick('enfoque')}>
              <a className="nav-link-text" href={href('enfoque')}>{tn.enfoque}</a>
              {caret(1)}
            </div>
            <div className="nav-drop wide">
              {/* Indexado por clave de ruta, no por posición: antes ENFOQUE_SUBS y el
                  diccionario se emparejaban por índice, y un ítem añadido en uno
                  solo de los dos desplazaba los enlaces hacia la página
                  equivocada sin fallar. */}
              {ENFOQUE_SUBS.map(key => {
                const item = tn.dropdown.enfoque[key] ?? {}
                return (
                  <a key={key} className="drop-item" href={href('enfoque', key)} onClick={onNavClick('enfoque', key)}>
                    <span className="drop-title">{item.title}</span>
                    <span className="drop-desc">{item.desc}</span>
                  </a>
                )
              })}
            </div>
          </li>

          <li className={`nav-item${openDrop === 2 ? ' expanded' : ''}`}>
            <div className={`nav-link${activeKey === 'clientes' ? ' active' : ''}`} onClick={onNavClick('clientes')}>
              <a className="nav-link-text" href={href('clientes')}>{tn.clientes}</a>
              {caret(2)}
            </div>
            <div className="nav-drop">
              {tn.dropdown.clientes.map((label, i) => (
                <a key={i} className="drop-item" href={href('clientes')} onClick={onNavClick('clientes')}>
                  <span className="drop-title">{label}</span>
                </a>
              ))}
            </div>
          </li>

          <li className="nav-item">
            <div className={`nav-link${activeKey === 'perspectivas' ? ' active' : ''}`} onClick={onNavClick('perspectivas')}>
              <a className="nav-link-text" href={href('perspectivas')}>{tn.perspectivas}</a>
            </div>
          </li>

          <li className="nav-item-cta">
            <a className="nav-cta" href={href('contacto')} onClick={onNavClick('contacto')}>{tn.cta}</a>
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
