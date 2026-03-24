import { useState, useEffect } from 'react'
import { t } from '../../shared/config/locales'
import { InvestmentPhilosophyPage } from './investmentPhilosophy/InvestmentPhilosophyPage'
import { MethodologicalFrameworkPage } from './methodologicalFramework/MethodologicalFrameworkPage'
import { OurMethodologyPage } from './ourMethodology/ourMethodology'
import { RiskPhilosophyPage } from './riskPhilosophy/RiskPhilosophyPage'

const subnav = t.enfoque.subnav

const subPages = {
  filosofia: InvestmentPhilosophyPage,
  framework: MethodologicalFrameworkPage,
  proceso:   OurMethodologyPage,
  riesgo:    RiskPhilosophyPage,
}

function SubNav({ active, onChange }) {
  return (
    <div className="subnav">
      <div className="subnav-inner">
        {Object.entries(subnav).map(([key, label]) => (
          <span
            key={key}
            className={`snav-link${active === key ? ' active' : ''}`}
            onClick={() => onChange(key)}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function OurApproachPage({ sub }) {
  const [active, setActive] = useState(sub ?? 'filosofia')

  useEffect(() => {
    if (sub) setActive(sub)
  }, [sub])

  const Page = subPages[active] ?? subPages.filosofia

  return (
    <div>
      <SubNav active={active} onChange={setActive} />
      <Page />
    </div>
  )
}
