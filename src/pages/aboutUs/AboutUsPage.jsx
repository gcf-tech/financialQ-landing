import { useState, useEffect } from 'react'
import { t } from '../../shared/config/locales'
import { FirmPage } from './firm/FirmPage'
import { TeamPage } from './team/TeamPage'
import { MissionPage } from './mission/MissionPage'
import { GovernancePage } from './governance/GovernancePage'

const subnav = t.sobre.subnav

const subPages = {
  firma: FirmPage,
  equipo: TeamPage,
  mision: MissionPage,
  governance: GovernancePage,
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

export function AboutUsPage({ sub }) {
  const [active, setActive] = useState(sub ?? 'firma')

  useEffect(() => {
    if (sub) setActive(sub)
  }, [sub])

  const Page = subPages[active] ?? subPages.firma

  return (
    <div>
      <SubNav active={active} onChange={setActive} />
      <Page />
    </div>
  )
}
