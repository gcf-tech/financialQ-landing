const PlusIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 2v12M2 8h12" strokeLinecap="round" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="5" />
    <path d="M8 5v3l2 2" strokeLinecap="round" />
  </svg>
)

function PrincipleIcon({ type }) {
  return type === 'plus' ? <PlusIcon /> : <ClockIcon />
}

export function TeamHeroSection({ content }) {
  return (
    <div className="wrap">
      <div className="eq-header">
        <div>
          <span className="eyebrow reveal eq-eyebrow">{content.eyebrow}</span>
          <h1 className="eq-headline reveal d1">
            {content.titleLines[0]}
            <br />
            <em>{content.titleLines[1]}</em>
            <br />
            {content.titleLines[2]}
          </h1>
        </div>

        <div>
          <p className="eq-lead reveal d1">{content.lead}</p>
          {content.principles.map((principle, index) => (
            <div key={principle.title} className={`eq-principle reveal d${index + 2}`}>
              <div className="eq-p-icon">
                <PrincipleIcon type={principle.icon} />
              </div>
              <div>
                <div className="eq-p-title">{principle.title}</div>
                <p className="eq-p-body">{principle.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
