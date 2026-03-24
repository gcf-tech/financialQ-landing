import { useState } from 'react'
import { Header } from './widgets/header/Header'
import { LandingPage } from './pages/landing/LandingPage'
import { AboutUsPage } from './pages/aboutUs/AboutUsPage'
import { OurApproachPage } from './pages/ourApproach/OurApproachPage'
import { CustomerPage } from './pages/customer/CustomerPage'
import { PerspectivesPage } from './pages/perspectives/PerspectivesPage'
import { GovernancePage } from './pages/aboutUs/governance/GovernancePage'
import { ContactoPage } from './pages/contacto/ContactoPage'

function App() {
  const [nav, setNav] = useState({ page: 'inicio', sub: null })

  const navigate = (page, sub = null) => {
    setNav({ page, sub })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pages = {
    inicio: <LandingPage navigate={navigate} />,
    sobre: <AboutUsPage sub={nav.sub} />,
    enfoque: <OurApproachPage sub={nav.sub} />,
    clientes: <CustomerPage navigate={navigate} />,
    perspectivas: <PerspectivesPage />,
    governance: <GovernancePage navigate={navigate} />,
    contacto: <ContactoPage navigate={navigate} />,
  }

  return (
    <>
      <Header navigate={navigate} />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        {pages[nav.page] ?? pages.inicio}
      </main>
    </>
  )
}

export default App
