import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Card from "./components/Card";
import { randomTopic } from "./utils/randomTopics";
import html2canvas from "html2canvas";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export default function App() {
  const [topic, setTopic] = useState("");
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const cardRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("fcc_theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    localStorage.setItem("fcc_theme", theme === "dark" ? "dark" : "light");
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const handleRandom = () => setTopic(randomTopic());

  const safeParseJson = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      const first = text.indexOf("{"),
        last = text.lastIndexOf("}");
      if (first !== -1 && last !== -1 && last > first) {
        try {
          return JSON.parse(text.slice(first, last + 1));
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const generateCard = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setCard(null);

    try {
      const system = `You are a playful short social-card generator. Output only valid JSON with keys: title, emoji, body, hashtags (array). Keep title <=5 words, body <= 40 words total. Output JSON only, nothing else.`;
      const payload = {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: system }, { role: "user", content: `Topic: ${trimmed}\nProduce one JSON object only.` }],
        max_tokens: 180,
        temperature: 0.82
      };

      const res = await axios.post(GROQ_ENDPOINT, payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` }
      });

      const raw = res.data?.choices?.[0]?.message?.content ?? "";
      const parsed = safeParseJson(raw);

      if (parsed && parsed.title && parsed.body) {
        setCard({ title: String(parsed.title).trim(), emoji: parsed.emoji ? String(parsed.emoji).trim() : "", body: String(parsed.body).trim(), hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [] });
      } else {
        // fallback: show raw text in card body
        setCard({ title: trimmed.length <= 30 ? trimmed : "Fun Card", emoji: "", body: raw.replace(/\n{2,}/g, "\n").trim() || "Couldn't parse response.", hashtags: [] });
      }
    } catch (err) {
      console.error(err);
      setError("Generation failed — see console for details.");
    } finally {
      setLoading(false);
    }
  };

  const saveAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const data = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = data;
      a.download = `${(card?.title || "fun-card").replace(/\s+/g, "-")}.png`;
      a.click();
    } catch (err) {
      console.error("save error", err);
      setError("Could not save image.");
    }
  };

  const shareCard = async () => {
    if (!card) return;
    const text = `${card.title}\n\n${card.body}\n\n${(card.hashtags || []).map((h) => "#" + h).join(" ")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: card.title, text });
      } catch (err) {
        console.error("share failed", err);
        setError("Share cancelled or failed.");
      }
    } else {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="container">
      <header>
        <div className="header-buttons">
          <button className="icon-btn" onClick={handleRandom} title="Random topic">
            🔀
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        <h1>Fun Chat Cards</h1>
        <p className="subtitle">Short, punchy social cards</p>
      </header>

      <div className="controls" role="region" aria-label="controls">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Type a topic (or click 🔀)"
          onKeyDown={(e) => {
            if (e.key === "Enter") generateCard();
          }}
        />
        <button onClick={generateCard} disabled={loading || !topic.trim()}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <main style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 760 }}>
          {card ? (
            <div className="card-wrapper">
              <div ref={cardRef}>
                <Card {...card} />
              </div>

              <div className="card-actions">
                <button className="action-btn" onClick={saveAsImage}>
                  📸 Save Image
                </button>
                <button className="action-btn" onClick={shareCard}>
                  🔗 Share
                </button>
                <button
                  className="action-btn"
                  onClick={() => {
                    generateCard();
                  }}
                >
                  ✨ Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">No card yet — type a topic and press Generate</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
