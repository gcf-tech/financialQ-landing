export function TeamMembersGrid({ members }) {
  return (
    <div className="eq-grid">
      {members.map((member, index) => (
        <div key={member.initials} className={`eq-card reveal${index > 0 ? ` d${index}` : ''}`}>
          <div className="eq-monogram">
            <span>{member.initials}</span>
          </div>
          <div className="eq-name">{member.name}</div>
          <span className="eq-role">{member.role}</span>
          <div className="eq-rule" />
          <p className="eq-bio">{member.bio}</p>
        </div>
      ))}
    </div>
  )
}
