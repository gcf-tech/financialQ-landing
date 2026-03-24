export function TeamPhilosophySection({ content }) {
  return (
    <div className="eq-philosophy">
      <div className="wrap">
        <div className="eq-phil-grid">
          <div>
            <span className="eyebrow reveal eq-eyebrow-soft">{content.eyebrow}</span>
            <h2 className="eq-phil-quote reveal d1">
              {content.quoteLines[0]}
              <br />
              {content.quoteLines[1]}
              <br />
              <em>{content.quoteLines[2]}</em>
            </h2>
          </div>

          <div className="eq-values">
            {content.values.map((value, index) => (
              <div key={value.label} className={`eq-val reveal${index > 0 ? ` d${index}` : ''}`}>
                <div className="eq-val-label">{value.label}</div>
                <div className="eq-val-text">{value.title}</div>
                <p className="eq-val-sub">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
