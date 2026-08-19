import { motion } from "framer-motion";

export default function Card({ title, emoji, body, hashtags, color, aspectRatio = "auto", fontStyle = "sans", handle = "" }) {
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

  const cardStyle = color ? {
    borderTop: `6px solid ${color}`,
    backgroundImage: `linear-gradient(135deg, transparent 60%, ${color}22 100%)`
  } : {};

  return (
    <motion.article
      className={`card animated-card aspect-${aspectRatio} font-${fontStyle}`}
      aria-label={t}
      style={cardStyle}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="card-header">
        <div className="card-title">
          <div contentEditable suppressContentEditableWarning>{titleWithEmoji}</div>
        </div>
      </div>

      <div className="card-body">
        {bodyLines.length > 0 ? (
          bodyLines.map((line, i) => (
            <p className="card-text" key={i} contentEditable suppressContentEditableWarning>
              {line}
            </p>
          ))
        ) : (
          <p className="card-text" contentEditable suppressContentEditableWarning>—</p>
        )}
      </div>

      {
        Array.isArray(hashtags) && hashtags.length > 0 && (
          <div className="card-tags" aria-hidden="false">
            {hashtags.slice(0, 6).map((h, i) => (
              <span className="tag" key={i} contentEditable suppressContentEditableWarning>
                #{String(h).replace(/^#/, "")}
              </span>
            ))}
          </div>
        )
      }

      {handle && (
        <div className="card-handle">
          {handle.startsWith("@") ? handle : `@${handle}`}
        </div>
      )}
    </motion.article >
  );
}
