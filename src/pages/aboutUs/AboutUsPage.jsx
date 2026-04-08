import { useParams } from 'react-router-dom'
import { t } from '../../shared/config/locales'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { SLUG_TO_KEY } from '../../shared/config/routes'
import { SubNav } from '../../shared/ui/subNav/SubNav'
import { FirmPage } from './firm/FirmPage'
import { MissionPage } from './mission/MissionPage'
import { GovernancePage } from './governance/GovernancePage'

const subPages = {
  firma: FirmPage,
  mision: MissionPage,
  governance: GovernancePage,
}

export function AboutUsPage() {
  const { sub: slugSub } = useParams()
  const { lang } = useTranslation()
  const navigate = useAppNavigate()

  // Convierte el slug de la URL (e.g. 'firm') a clave interna (e.g. 'firma')
  const active = slugSub ? (SLUG_TO_KEY[lang][slugSub] ?? slugSub) : 'firma'
  const Page = subPages[active] ?? subPages.firma

  return (
    <div>
      <SubNav items={Object.fromEntries(Object.entries(t.sobre.subnav).filter(([k]) => k !== 'equipo'))} active={active} onChange={key => navigate('sobre', key)} />
      <Page />
    </div>
  )
}
