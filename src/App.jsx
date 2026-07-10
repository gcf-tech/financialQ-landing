import { Routes, Route } from 'react-router-dom'
import { Header } from './widgets/header/Header'
import { LandingPage } from './pages/landing/LandingPage'
import { AboutUsPage } from './pages/aboutUs/AboutUsPage'
import { OurApproachPage } from './pages/ourApproach/OurApproachPage'
import { CustomerPage } from './pages/customer/CustomerPage'
import { PerspectivesPage } from './pages/perspectives/PerspectivesPage'
import { PostDetailPage } from './pages/perspectives/PostDetailPage'
import { ContactoPage } from './pages/contacto/ContactoPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { PostEditorPage } from './pages/admin/PostEditorPage'
import { ResetPasswordPage } from './pages/admin/ResetPasswordPage'
import { LanguagePicker } from './shared/ui/languagePicker/LanguagePicker'

function App() {
  return (
    <>
      <Header />
      <LanguagePicker />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* About Us — ES + EN */}
          <Route path="/sobre/:sub?" element={<AboutUsPage />} />
          <Route path="/about/:sub?" element={<AboutUsPage />} />

          {/* Our Approach — ES + EN */}
          <Route path="/enfoque/:sub?" element={<OurApproachPage />} />
          <Route path="/approach/:sub?" element={<OurApproachPage />} />

          {/* Clients — ES + EN */}
          <Route path="/clientes" element={<CustomerPage />} />
          <Route path="/clients" element={<CustomerPage />} />

          {/* Perspectives — ES + EN */}
          <Route path="/perspectivas" element={<PerspectivesPage />} />
          <Route path="/perspectives" element={<PerspectivesPage />} />

          {/* Perspectives detail (artículo local) — ES + EN */}
          <Route path="/perspectivas/:id" element={<PostDetailPage />} />
          <Route path="/perspectives/:id" element={<PostDetailPage />} />

          {/* Contact — ES + EN */}
          <Route path="/contacto" element={<ContactoPage />} />
          <Route path="/contact" element={<ContactoPage />} />

          {/* Admin (editor de Perspectives) — ruta única, sin variante por idioma */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/post/:slug?" element={<PostEditorPage />} />

          {/* Restablecer contraseña (enlace del correo) — ruta única */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
