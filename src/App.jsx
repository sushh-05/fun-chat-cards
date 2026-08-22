import { useEffect, useRef, useState } from "react";
import Card from "./components/Card";
import { randomTopic } from "./utils/randomTopics";
import html2canvas from "html2canvas";
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";

export default function App() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Playful");
  const [aspectRatio, setAspectRatio] = useState("auto");
  const [fontStyle, setFontStyle] = useState("sans");
  const [handle, setHandle] = useState("");
  const [card, setCard] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const cardRef = useRef(null);
  const vantaRef = useRef(null); // dedicated fixed background div
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("fcc_theme");
    if (saved === "dark" || saved === "light") setTheme(saved);

    const savedHistory = localStorage.getItem("fcc_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    localStorage.setItem("fcc_theme", theme === "dark" ? "dark" : "light");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("fcc_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!vantaEffect && window.VANTA) {
      setVantaEffect(
        window.VANTA.BIRDS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          colorMode: "variance",
          backgroundAlpha: 0,
          color1: 0xff3563,
          color2: 0xff6b8f,
          quantity: 2,
          birdSize: 0.8,     // smaller = less visually dominant
          wingSpan: 18.00,
          speedLimit: 3.00,
          separation: 100.00,
          alignment: 50.00,
          cohesion: 50.00
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const handleRandom = () => setTopic(randomTopic());

  const playSound = (type) => {
    try {
      const audio = new Audio(
        type === "success"
          ? "https://cdn.freesound.org/previews/411/411088_5121236-lq.mp3" // Ding
          : "https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3" // Pop
      );
      audio.volume = 0.3;
      audio.play();
    } catch (e) {
      // Ignore audio errors (e.g. autoplay blocked)
    }
  };

  const generateCard = async () => {
    const trimmed = topic.trim();

    if (!trimmed) {
      toast.error("Please enter a topic first.");
      return;
    }

    if (trimmed.length > 150) {
      toast.error("Topic must be 150 characters or less.");
      return;
    }

    setLoading(true);
    setCard(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed, tone })
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
        if (res.status === 400) throw new Error("Invalid input. Please check your topic.");
        throw new Error("Server error. Please try again.");
      }

      const data = await res.json();
      const newCard = data.result; // Guaranteed to be validated by Zod on the backend

      setCard(newCard);
      setHistory((prev) => [newCard, ...prev].slice(0, 10)); // Keep last 10
      playSound("pop");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Generation failed — see console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Part 5: export pixel dimensions per format
  const EXPORT_SIZES = {
    auto: { width: 1080, height: null },
    square: { width: 1080, height: 1080 },
    portrait: { width: 1080, height: 1350 },
    landscape: { width: 1920, height: 1080 },
  };

  const saveAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const { width, height } = EXPORT_SIZES[aspectRatio] || EXPORT_SIZES.auto;
      const opts = { backgroundColor: null, scale: 2 };
      if (width) opts.width = width / 2;
      if (height) opts.height = height / 2;
      const canvas = await html2canvas(cardRef.current, opts);
      const data = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = data;
      a.download = `${(card?.title || "fun-card").replace(/\s+/g, "-")}.png`;
      a.click();
      toast.success("Image saved!");
      playSound("success");
    } catch (err) {
      console.error("save error", err);
      toast.error("Could not save image.");
    }
  };

  const shareCard = async () => {
    if (!card) return;
    const text = `${card.title}\n\n${card.body}\n\n${(card.hashtags || []).map((h) => "#" + h).join(" ")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: card.title, text });
        toast.success("Shared successfully!");
        playSound("success");
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch (err) {
        console.error("share failed", err);
        toast.error("Share cancelled or failed.");
      }
    } else {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      playSound("success");
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    }
  };

  const copyText = async () => {
    if (!card) return;
    const text = `${card.title}\n\n${card.body}\n\n${(card.hashtags || []).map((h) => "#" + h).join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Text copied to clipboard!");
      playSound("success");
    } catch (err) {
      console.error("copy text failed", err);
      toast.error("Failed to copy text.");
    }
  };

  const copyImage = async () => {
    if (!cardRef.current) return;
    try {
      const { width, height } = EXPORT_SIZES[aspectRatio] || EXPORT_SIZES.auto;
      const opts = { backgroundColor: null, scale: 2 };
      if (width) opts.width = width / 2;
      if (height) opts.height = height / 2;
      const canvas = await html2canvas(cardRef.current, opts);
      canvas.toBlob(async (blob) => {
        if (!blob) return toast.error("Failed to generate image.");
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          toast.success("Image copied to clipboard!");
          playSound("success");
        } catch (err) {
          console.error("copy image failed", err);
          toast.error("Failed to copy image.");
        }
      }, "image/png");
    } catch (err) {
      console.error("copy image error", err);
      toast.error("Could not copy image.");
    }
  };

  return (
    <>
      <div className="background-layer">
        {/* Fixed background layer — Vanta renders here */}
        <div ref={vantaRef} className="vanta-bg" />

        {/* Fading grid decorations */}
        <div className="grid-decorations">
          <div className="deco-grid deco-grid--br" aria-hidden="true" />
          <div className="deco-grid deco-grid--bl" aria-hidden="true" />
          <div className="deco-grid deco-grid--tr" aria-hidden="true" />
          <div className="deco-grid deco-grid--tl" aria-hidden="true" />
        </div>
      </div>

      {/* All UI content sits above the background */}
      <div className="app-wrapper">
        <div className="container">
          <header>
            <div className="header-buttons">
              <button className="icon-btn" onClick={handleRandom} title="Surprise me" aria-label="Surprise me">
                🎲
              </button>
              <button className="icon-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
                {theme === "dark" ? "🌙 Dark" : "☀️Light "}
              </button>
            </div>

            <h1>Fun Chat Cards</h1>
            <p className="subtitle">Short, punchy social cards</p>
          </header>

          <div className="generator-group">
            <div className="controls" role="region" aria-label="controls">
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="tone-selector">
                <option value="Playful">Playful</option>
                <option value="Sarcastic">Sarcastic</option>
                <option value="Inspirational">Inspirational</option>
                <option value="Professional">Professional</option>
                <option value="Gen-Z">Gen-Z</option>
              </select>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Type a topic (or click 🎲)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") generateCard();
                }}
              />
              <button onClick={generateCard} disabled={loading}>
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>

            <div className={`char-counter ${topic.length > 150 ? 'error' : ''}`}>
              {topic.length} / 150
            </div>

            <div className="trending-chips">
              {["🔥 Monday Motivation", "💻 Tech Humor", "🚿 Shower Thoughts", "☕ Coffee Cravings"].map((chip) => (
                <button
                  key={chip}
                  className="chip"
                  onClick={() => {
                    const text = chip.replace(/^[^\s]+\s/, ""); // Remove emoji
                    setTopic(text);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {card && (
            <div className="customization-bar">
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="tone-selector small">
                <option value="auto">Auto Size</option>
                <option value="square">Square (1:1)</option>
                <option value="portrait">Portrait (4:5)</option>
                <option value="landscape">Landscape (16:9)</option>
              </select>

              <select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)} className="tone-selector small">
                <option value="sans">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="mono">Monospace</option>
                <option value="handwriting">Handwriting</option>
              </select>

              <input
                type="text"
                placeholder="@username"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="handle-input"
              />
            </div>
          )}

          <Toaster position="bottom-center" />

          <main style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 760 }}>
              {loading ? (
                <div className="card-wrapper">
                  <div className="card skeleton-card">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-body"></div>
                    <div className="skeleton-body short"></div>
                    <div className="skeleton-tags">
                      <div className="skeleton-tag"></div>
                      <div className="skeleton-tag"></div>
                      <div className="skeleton-tag"></div>
                    </div>
                  </div>
                </div>
              ) : card ? (
                <div className="card-canvas">
                  <div ref={cardRef}>
                    <Card {...card} aspectRatio={aspectRatio} fontStyle={fontStyle} handle={handle} />
                  </div>

                  <div className="card-actions">
                    <button className="action-btn" onClick={saveAsImage}>
                      📸 Save Image
                    </button>
                    <button className="action-btn" onClick={copyImage}>
                      📋 Copy Image
                    </button>
                    <button className="action-btn" onClick={copyText}>
                      📝 Copy Text
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
                  <div className="workflow-hint">
                    <span>Create</span>
                    <span>→</span>
                    <span>Customize</span>
                    <span>→</span>
                    <span>Share</span>
                  </div>
                </div>
              )}
            </div>
          </main>

          {history.length > 0 && (
            <section className="history-section">
              <details className="history-details">
                <summary className="history-summary">  Your Past Cards ({history.length})</summary>
                <div className="history-grid">
                  {history.map((hCard, idx) => (
                    <div key={idx} className="history-card-wrapper" onClick={() => setCard(hCard)}>
                      <Card {...hCard} aspectRatio="auto" fontStyle="sans" handle="" />
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
