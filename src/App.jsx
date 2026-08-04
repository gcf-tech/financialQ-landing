import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Header } from './widgets/header/Header'
import { LandingPage } from './pages/landing/LandingPage'
import { AboutUsPage } from './pages/aboutUs/AboutUsPage'
import { OurApproachPage } from './pages/ourApproach/OurApproachPage'
import { CustomerPage } from './pages/customer/CustomerPage'
import { PerspectivesPage } from './pages/perspectives/PerspectivesPage'
import { ContactoPage } from './pages/contacto/ContactoPage'
import { LanguagePicker } from './shared/ui/languagePicker/LanguagePicker'
import { useDocumentMeta } from './shared/lib/useDocumentMeta'

// Rutas cargadas bajo demanda. Son las únicas que arrastran react-markdown y
// su cadena de plugins (~90 kB min): el detalle de post y el editor admin.
// Ninguna es indexable ni la ve un visitante que solo entra a la home, así que
// no tienen por qué pesar en el bundle inicial.
const PostDetailPage = lazy(() =>
  import('./pages/perspectives/PostDetailPage').then(m => ({ default: m.PostDetailPage }))
)
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage }))
)
const PostEditorPage = lazy(() =>
  import('./pages/admin/PostEditorPage').then(m => ({ default: m.PostEditorPage }))
)
const ResetPasswordPage = lazy(() =>
  import('./pages/admin/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage }))
)

function App() {
  // Título, description, canonical y hreflang de cada ruta en navegación SPA.
  // El HTML inicial ya llega con el <head> correcto desde el build.
  useDocumentMeta()

  return (
    <>
      <Header />
      <LanguagePicker />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Solo se activa en las rutas lazy (detalle de post y admin); las
            páginas públicas siguen siendo síncronas y no ven el fallback. */}
        <Suspense fallback={null}>
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
        </Suspense>
      </main>
    </>
  )
}

export default App
