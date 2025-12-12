import { useState } from "react";
import axios from "axios";
import Card from "./components/Card";

function safeParseJson(text) {
  // try to find a JSON object in the response and parse it
  try {
    // Common case: the model returns a raw JSON object
    return JSON.parse(text);
  } catch {
    // Try to extract a JSON block from the text
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const sub = text.slice(first, last + 1);
      try {
        return JSON.parse(sub);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [card, setCard] = useState(null); // { title, emoji, body, hashtags }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateCard = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setCard(null);

    try {
      // Strong structured prompt — asks for strict JSON with title/body/emoji/hashtags
      const system = `You are a creative, witty, short social "card" generator. Your job is to produce a single JSON object only (no extra commentary, no backticks) that describes a short social chat card. The JSON object MUST have these fields:
- "title": short punchy title (max 5 words)
- "emoji": a single emoji (or empty string)
- "body": one or two short lines (max 40 words total), in a playful conversational tone. Use contractions, keep it snappy.
- "hashtags": an array of up to 3 short hashtag strings (without #).

Requirements:
1. **Output only valid JSON**. Nothing else.
2. Keep title <= 5 words. Keep body <= 40 words.
3. Use varied micro-styles: sometimes witty, sometimes sarcastic, sometimes warm.
4. Do not mention 'AI', 'model', 'OpenAI', 'Groq' or 'API' in the content.
5. Prefer emojis that match the topic. Use at most one emoji in the emoji field.
6. If topic is ambiguous, pick a playful angle and own it.
7. If the user asks for an all-caps topic, preserve the topic meaning but do not produce excessively long text.

Example output (valid JSON ONLY):
{
  "title": "Caffeine Alert!",
  "emoji": "☕",
  "body": "You: I need coffee to function today\\nMe: Same here! How many cups are you planning on mainlining?",
  "hashtags": ["coffee","late-night","relatable"]
}
`;

      const user = `Topic: ${trimmed}
Produce ONE JSON object following the system rules above.`;

      const payload = {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        max_tokens: 160,
        temperature: 0.85
      };

      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        payload,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const raw = res.data?.choices?.[0]?.message?.content ?? "";
      // try to parse JSON
      const parsed = safeParseJson(raw);

      if (parsed && parsed.title && parsed.body) {
        // Ensure fields exist and are strings
        setCard({
          title: String(parsed.title).trim(),
          emoji: parsed.emoji ? String(parsed.emoji).trim() : "",
          body: String(parsed.body).trim(),
          hashtags: Array.isArray(parsed.hashtags)
            ? parsed.hashtags.map((h) => String(h).replace(/^#/, "").trim()).slice(0, 3)
            : []
        });
      } else {
        // Fallback: create a simple card from the raw text (still nicer)
        // Try to split into title and body heuristically
        let title = trimmed.length > 0 ? trimmed : "Fun Card";
        let body = raw.trim();
        // If raw contains a newline, use first line as title if short
        const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2 && lines[0].length <= 30) {
          title = lines[0];
          body = lines.slice(1).join(" ");
        } else if (lines.length === 1 && lines[0].length <= 40) {
          body = lines[0];
        }

        setCard({
          title,
          emoji: "",
          body: body || "Couldn't parse AI response.",
          hashtags: []
        });
      }
    } catch (err) {
      console.error(err);
      setError("Generation failed — check console or your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Fun Chat Cards</h1>
      <p className="subtitle">Short, punchy social cards</p>

      <div className="controls">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Type a topic (e.g., coffee culture, first dates)"
        />
        <button onClick={generateCard} disabled={loading || !topic.trim()}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {card && <Card {...card} />}
    </div>
  );
}
