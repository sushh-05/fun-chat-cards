// src/components/Card.jsx
export default function Card({ title, emoji, body, hashtags }) {
  const safe = (s) => (typeof s === "string" ? s : "");
  const t = safe(title);
  const e = safe(emoji).trim();
  const b = safe(body);

  // Put emoji at the end of the title
  const titleWithEmoji = e ? `${t} ${e}` : t;

  // For body: split on literal \n or real newlines
  const bodyLines = b.split("\\n").join("\n").split("\n").map((l) => l.trim()).filter(Boolean);

  // Append emoji to last line of body if emoji exists and body isn't empty
  if (e && bodyLines.length > 0) {
    const lastIdx = bodyLines.length - 1;
    bodyLines[lastIdx] = `${bodyLines[lastIdx]} ${e}`;
  }

  return (
    <article className="card animated-card" aria-label={t}>
      <div className="card-header">
        <div className="card-title">
          <div>{titleWithEmoji}</div>
        </div>
      </div>

      <div className="card-body">
        {bodyLines.length > 0 ? (
          bodyLines.map((line, i) => (
            <p className="card-text" key={i}>
              {line}
            </p>
          ))
        ) : (
          <p className="card-text">—</p>
        )}
      </div>

      {Array.isArray(hashtags) && hashtags.length > 0 && (
        <div className="card-tags" aria-hidden="false">
          {hashtags.slice(0, 6).map((h, i) => (
            <span className="tag" key={i}>
              #{String(h).replace(/^#/, "")}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
