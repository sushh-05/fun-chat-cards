export default function Card({ title, emoji, body, hashtags }) {
  return (
    <div className="card card-elevated">
      <div className="card-header">
        <div className="card-title">
          {emoji ? <span className="card-emoji">{emoji}</span> : null}
          <strong>{title}</strong>
        </div>
      </div>

      <div className="card-body">
        {/* preserve line breaks if present */}
        {body.split("\\n").map((line, idx) => (
          <p key={idx} className="card-text">
            {line}
          </p>
        ))}
      </div>

      {Array.isArray(hashtags) && hashtags.length > 0 && (
        <div className="card-tags">
          {hashtags.map((h, i) => (
            <span className="tag" key={i}>
              #{h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
