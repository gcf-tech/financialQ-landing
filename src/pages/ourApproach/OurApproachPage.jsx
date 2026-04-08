import { useParams } from 'react-router-dom'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { SLUG_TO_KEY } from '../../shared/config/routes'
import { SubNav } from '../../shared/ui/subNav/SubNav'
import { InvestmentPhilosophyPage } from './investmentPhilosophy/InvestmentPhilosophyPage'
import { MethodologicalFrameworkPage } from './methodologicalFramework/MethodologicalFrameworkPage'
import { OurMethodologyPage } from './ourMethodology/ourMethodology'
import { RiskPhilosophyPage } from './riskPhilosophy/RiskPhilosophyPage'

const subPages = {
  filosofia: InvestmentPhilosophyPage,
  framework: MethodologicalFrameworkPage,
  proceso:   OurMethodologyPage,
  riesgo:    RiskPhilosophyPage,
}

export function OurApproachPage() {
  const { sub: slugSub } = useParams()
  const { t, lang } = useTranslation()
  const navigate = useAppNavigate()

  // Convierte el slug de la URL (e.g. 'philosophy') a clave interna (e.g. 'filosofia')
  const active = slugSub ? (SLUG_TO_KEY[lang][slugSub] ?? slugSub) : 'filosofia'
  const Page = subPages[active] ?? subPages.filosofia

  return (
    <div>
      <SubNav items={t.enfoque.subnav} active={active} onChange={key => navigate('enfoque', key)} />
      <Page />
    </div>
  )
}
