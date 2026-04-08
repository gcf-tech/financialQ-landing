import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useTranslation } from '../../../shared/config/locales/i18nContext'
import { TeamHeroSection } from './ui/TeamHeroSection'
import { TeamMembersGrid } from './ui/TeamMembersGrid'
import { TeamPhilosophySection } from './ui/TeamPhilosophySection'
import './ui/teamPage.css'

export function TeamPage() {
  useScrollReveal()
  const { t } = useTranslation()
  const team = t.sobre.team

  return (
    <div>
      <section className="s-team">
        <TeamHeroSection content={team.header} />
        <TeamMembersGrid members={team.members} />
        <TeamPhilosophySection content={team.philosophy} />
      </section>
      <Footer variant="mini" />
    </div>
  )
}
