export default function ComingSoon({ icon, title, description, features, port }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="coming-soon-badge">🚧 Under Development</div>

      {features && (
        <div className="coming-soon-features">
          {features.map(f => (
            <div className="coming-soon-feature" key={f.label}>
              <div className="feat-icon">{f.icon}</div>
              <div>{f.label}</div>
            </div>
          ))}
        </div>
      )}

      {port && (
        <p className="coming-soon-port">
          This service will run on port{' '}
          <code style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: 3 }}>:{port}</code>
        </p>
      )}
    </div>
  );
}
