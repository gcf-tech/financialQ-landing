import './socialLinks.css'

// Redes oficiales de la firma. Una red sin `url` no se renderiza.
const SOCIAL_LINKS = [
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/financial.qgroup/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/david-enciso-32451b98/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v2a6 6 0 0 1 2-2z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
]

export function SocialLinks({ className = '' }) {
  return (
    <div className={`social-links ${className}`.trim()}>
      {SOCIAL_LINKS.filter(s => s.url).map(s => (
        <a
          key={s.id}
          className="social-link"
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
        >
          {s.icon}
        </a>
      ))}
    </div>
  )
}
