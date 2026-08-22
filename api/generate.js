import { z } from 'zod';

const cardSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    emoji: z.string().min(1, "Emoji is required").max(10, "Emoji is too long"),
    body: z.string().min(1, "Body is required").max(500, "Body is too long"),
    hashtags: z.array(z.string().max(50)).max(10, "Too many hashtags"),
    color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color").optional().or(z.literal(''))
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { topic, tone } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    if (topic.length > 150) {
        return res.status(400).json({ error: 'Topic is too long (max 150 characters)' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error(`[${new Date().toISOString()}] Server configuration error: Missing GROQ_API_KEY`);
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const toneGuides = {
        playful: "Fun, witty, upbeat, and lighthearted. Make the humor feel natural rather than overly enthusiastic.",
        sarcastic: "Witty, dry, ironic, and slightly cynical. Roll your eyes at the topic.",
        inspirational: "Uplifting, motivating, and encouraging. Focus on growth and positivity.",
        professional: "Clear, formal, and business-appropriate. Avoid slang.",
        "gen-z": "Casual, internet-native, playful, and contemporary. Use natural modern online language sparingly; avoid forced slang or trying too hard to sound Gen-Z."
    };

    const selectedTone = (tone || 'playful').toLowerCase();
    const toneInstruction = toneGuides[selectedTone] || toneGuides.playful;

    const system = `You are a short social-card generator. 
CRITICAL REQUIREMENT: Your entire response (title, body, emoji, and hashtags) MUST strictly embody a ${selectedTone.toUpperCase()} tone. 
Tone Guide: ${toneInstruction}

Output only valid JSON with keys: title, emoji, body, hashtags (array), color (a hex color code matching the vibe). Keep title <=5 words, body <= 40 words total. Output JSON only, nothing else.`;

    let messages = [
        { role: "system", content: system },
        { role: "user", content: `Topic: ${topic.trim()}\nProduce one JSON object only.` }
    ];

    const MAX_ATTEMPTS = 2;
    const TIMEOUT_MS = 10000; // 10 seconds

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const payload = {
                model: "openai/gpt-oss-20b",
                messages: messages,
                response_format: { type: "json_object" },
                max_tokens: 1024,
                temperature: 0.82
            };

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;

            if (!response.ok) {
                const status = response.status;
                console.error(`[${new Date().toISOString()}] Attempt ${attempt} failed: HTTP ${status} (${latency}ms)`);

                if (attempt === MAX_ATTEMPTS) {
                    if (status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
                    return res.status(502).json({ error: 'Upstream API error' });
                }

                // Do not retry on 4xx (except 429 Rate Limit)
                if (status >= 400 && status < 500 && status !== 429) {
                    return res.status(502).json({ error: 'Upstream API error' });
                }

                continue; // Retry on 5xx or 429
            }

            const data = await response.json();
            const raw = data?.choices?.[0]?.message?.content ?? "{}";

            let parsedJson;
            try {
                parsedJson = JSON.parse(raw);
            } catch (e) {
                console.error(`[${new Date().toISOString()}] Attempt ${attempt} failed: Malformed JSON (${latency}ms)`);
                if (attempt === MAX_ATTEMPTS) {
                    return res.status(502).json({ error: 'LLM returned malformed JSON' });
                }
                // Adjust prompt for retry
                messages.push({ role: "user", content: "The previous response was not valid JSON. Return ONLY a valid JSON object matching the required schema. Do not include markdown or explanatory text." });
                continue;
            }

            const validation = cardSchema.safeParse(parsedJson);
            if (!validation.success) {
                console.error(`[${new Date().toISOString()}] Attempt ${attempt} failed: Zod Validation Error (${latency}ms)`);
                if (attempt === MAX_ATTEMPTS) {
                    return res.status(502).json({ error: 'LLM output failed validation' });
                }
                // Adjust prompt for retry
                const failedFields = validation.error.issues.map(issue => issue.path.join('.')).join(', ');
                messages.push({ role: "user", content: `The previous response did not match the required schema (issues with: ${failedFields || 'structure'}). Return ONLY a valid JSON object with title, emoji, body, hashtags, and color. Do not include markdown or explanatory text.` });
                continue;
            }

            console.log(`[${new Date().toISOString()}] Attempt ${attempt} success (${latency}ms)`);
            return res.status(200).json({ result: validation.data });

        } catch (error) {
            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;
            const isTimeout = error.name === 'AbortError';
            const errorType = isTimeout ? 'Timeout' : 'Network/Unknown Error';

            console.error(`[${new Date().toISOString()}] Attempt ${attempt} failed: ${errorType} (${latency}ms)`);

            if (attempt === MAX_ATTEMPTS) {
                return res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
}
