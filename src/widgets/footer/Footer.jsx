import './Footer.css'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate, useAppPath } from '../../shared/lib/useAppNavigate'
import { SocialLinks } from '../../shared/ui/socialLinks/SocialLinks'
import logo1x from '../../assets/images/footer/logo_blanco_financialQ-158w.webp'
import logo2x from '../../assets/images/footer/logo_blanco_financialQ-316w.webp'

function LegalLinks({ tf }) {
  return (
    <div className="fleg">
      <a href="/docs/2026_Privacy_Notice-FinancialQGroup.pdf" download="2026 Privacy Notice - Financial Q Group.pdf">{tf.legalLinks.privacy}</a>
      {/*<a href="#">{tf.legalLinks.terms}</a>*/}
      <a href="https://adviserinfo.sec.gov/firm/summary/327095" target="_blank" rel="noopener noreferrer">{tf.legalLinks.adv}</a>
      {/*<a href="#">{tf.legalLinks.crs}</a>*/}
    </div>
  )
}

export function Footer({ variant = 'mini' }) {
  const { t } = useTranslation()
  const tf = t.footer
  const navigate = useAppNavigate()
  const href = useAppPath()

  // Enlaces reales para los crawlers; el click normal navega por el router.
  // Ver la misma lógica en widgets/header/Header.jsx.
  const onNavClick = (page, sub) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(page, sub)
  }

  if (variant === 'mini') {
    return (
      <footer className="main-footer">
        <div className="wrap">
          <div className="fbot">
            <p className="fdisc"><strong>{tf['disclosureLabel.bold']}</strong> {tf.disclosureShort}</p>
            <div className="fmeta">
              <LegalLinks tf={tf} />
              <SocialLinks />
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="main-footer">
      <div className="wrap">
        <div className="fg">
          <div className="fb">
            <div className="logo">
              <img
                src={logo1x}
                srcSet={`${logo1x} 1x, ${logo2x} 2x`}
                width="158"
                height="34"
                alt={t.common.logoAlt}
                className="logo-img"
              />
            </div>
            <p>{tf.tagline}</p>
            <SocialLinks className="fsocial" />
          </div>

          <div className="fc">
            <h5>{tf.sections.sobre}</h5>
            <ul>
              <li><a href={href('sobre', 'firma')} onClick={onNavClick('sobre', 'firma')}>{tf.links.firma}</a></li>
              {/* <li><a href={href('sobre', 'equipo')} onClick={onNavClick('sobre', 'equipo')}>{tf.links.equipo}</a></li> */}
              <li><a href={href('sobre', 'mision')} onClick={onNavClick('sobre', 'mision')}>{tf.links.mision}</a></li>
              <li><a href={href('sobre', 'governance')} onClick={onNavClick('sobre', 'governance')}>{tf.links.governance}</a></li>
            </ul>
          </div>

          <div className="fc">
            <h5>{tf.sections.enfoque}</h5>
            <ul>
              <li><a href={href('enfoque', 'filosofia')} onClick={onNavClick('enfoque', 'filosofia')}>{tf.links.filosofia}</a></li>
              <li><a href={href('enfoque', 'framework')} onClick={onNavClick('enfoque', 'framework')}>{tf.links.framework}</a></li>
              <li><a href={href('enfoque', 'riesgo')} onClick={onNavClick('enfoque', 'riesgo')}>{tf.links.riesgo}</a></li>
            </ul>
          </div>

          <div className="fc">
            <h5>{tf.sections.clientes}</h5>
            <ul>
              <li><a href={href('clientes')} onClick={onNavClick('clientes')}>{tf.links.profesionales}</a></li>
              <li><a href={href('clientes')} onClick={onNavClick('clientes')}>{tf.links.empresarios}</a></li>
              <li><a href={href('clientes')} onClick={onNavClick('clientes')}>{tf.links.internacional}</a></li>
              <li><a href={href('clientes')} onClick={onNavClick('clientes')}>{tf.links.fundadores}</a></li>
            </ul>
          </div>

          <div className="fc">
            <h5>{tf.sections.legal}</h5>
            <ul>
              <li><a href="/docs/2026_Privacy_Notice-FinancialQGroup.pdf" download="2026 Privacy Notice - Financial Q Group.pdf">{tf.links.privacy}</a></li>
              {/*<li><a href="#">{tf.links.terms}</a></li>*/}
              <li><a href="https://adviserinfo.sec.gov/firm/summary/327095" target="_blank" rel="noopener noreferrer">{tf.links.adv}</a></li>
            </ul>
          </div>
        </div>

        <div className="fbot">
          <p className="fdisc">
            <strong>{tf['disclosureLabelFull.bold']}</strong> {tf.disclosureFull}
          </p>
          <LegalLinks tf={tf} />
        </div>
      </div>
    </footer>
  )
}
