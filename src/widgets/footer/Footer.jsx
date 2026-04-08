import './Footer.css'
import { t } from '../../shared/config/locales'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import logoImg from '../../assets/images/footer/logo_blanco_financialQ.png'

const tf = t.footer

function LegalLinks() {
  return (
    <div className="fleg">
      <a href="#">{tf.legalLinks.privacy}</a>
      <a href="#">{tf.legalLinks.terms}</a>
      <a href="#">{tf.legalLinks.adv}</a>
      <a href="#">{tf.legalLinks.crs}</a>
    </div>
  )
}

export function Footer({ variant = 'mini' }) {
  const navigate = useAppNavigate()

  if (variant === 'mini') {
    return (
      <footer className="main-footer">
        <div className="wrap">
          <div className="fbot">
            <p className="fdisc"><strong>{tf['disclosureLabel.bold']}</strong> {tf.disclosureShort}</p>
            <LegalLinks />
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
              <img src={logoImg} alt={t.common.logoName} className="logo-img" />
            </div>
            <p>{tf.tagline}</p>
          </div>

          <div className="fc">
            <h5>{tf.sections.sobre}</h5>
            <ul>
              <li><span onClick={() => navigate('sobre', 'firma')}>{tf.links.firma}</span></li>
              {/* <li><span onClick={() => navigate('sobre', 'equipo')}>{tf.links.equipo}</span></li> */}
              <li><span onClick={() => navigate('sobre', 'mision')}>{tf.links.mision}</span></li>
              <li><span onClick={() => navigate('sobre', 'governance')}>{tf.links.governance}</span></li>
            </ul>
          </div>

          <div className="fc">
            <h5>{tf.sections.enfoque}</h5>
            <ul>
              <li><span onClick={() => navigate('enfoque', 'filosofia')}>{tf.links.filosofia}</span></li>
              <li><span onClick={() => navigate('enfoque', 'framework')}>{tf.links.framework}</span></li>
              <li><span onClick={() => navigate('enfoque', 'riesgo')}>{tf.links.riesgo}</span></li>
            </ul>
          </div>

          <div className="fc">
            <h5>{tf.sections.clientes}</h5>
            <ul>
              <li><span onClick={() => navigate('clientes')}>{tf.links.profesionales}</span></li>
              <li><span onClick={() => navigate('clientes')}>{tf.links.empresarios}</span></li>
              <li><span onClick={() => navigate('clientes')}>{tf.links.internacional}</span></li>
              <li><span onClick={() => navigate('clientes')}>{tf.links.fundadores}</span></li>
            </ul>
          </div>

          <div className="fc">
            <h5>{tf.sections.legal}</h5>
            <ul>
              <li><a href="#">{tf.links.privacy}</a></li>
              <li><a href="#">{tf.links.terms}</a></li>
              <li><a href="#">{tf.links.adv}</a></li>
              <li><a href="#">{tf.links.crs}</a></li>
            </ul>
          </div>
        </div>

        <div className="fbot">
          <p className="fdisc">
            <strong>{tf['disclosureLabelFull.bold']}</strong> {tf.disclosureFull}
          </p>
          <LegalLinks />
        </div>
      </div>
    </footer>
  )
}
