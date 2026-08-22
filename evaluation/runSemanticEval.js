import { testCases } from './testCases.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// 1. Load API Key safely without requiring 'dotenv' dependency
let GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const match = envFile.match(/^GROQ_API_KEY=(.*)$/m);
        if (match) GROQ_API_KEY = match[1].trim();
    } catch (e) {
        // Ignore file read errors
    }
}

if (!GROQ_API_KEY) {
    console.error("ERROR: GROQ_API_KEY is missing. Please ensure it is in your .env file or exported in your terminal.");
    process.exit(1);
}

// 2. Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api/generate';
const DELAY_MS = parseInt(process.env.EVAL_DELAY_MS, 10) || 3000;

// 3. Judge Schema
const judgeSchema = z.object({
    relevance: z.number().min(1).max(5),
    tone: z.number().min(1).max(5),
    coherence: z.number().min(1).max(5),
    conciseness: z.number().min(1).max(5),
    hashtag_quality: z.number().min(1).max(5),
    overall: z.number().min(1).max(5),
    reason: z.string()
});

async function runSemanticEvaluation() {
    console.log(`Starting Semantic AI Evaluation...`);
    console.log(`Target API: ${API_URL}`);
    console.log(`Judge Model: openai/gpt-oss-20b (via Groq)`);
    console.log(`Test cases: ${testCases.length}`);
    console.log(`Delay between requests: ${DELAY_MS}ms\n`);

    let successfulEvals = 0;
    let failedEvals = 0;

    const scores = {
        relevance: [],
        tone: [],
        coherence: [],
        conciseness: [],
        hashtag_quality: [],
        overall: []
    };

    for (let i = 0; i < testCases.length; i++) {
        const { topic, tone } = testCases[i];

        try {
            // Step 1: Generate the card using the production API
            const genResponse = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, tone })
            });

            if (!genResponse.ok) {
                console.log(`✗ ${topic} / ${tone} — Generation Failed (HTTP ${genResponse.status})`);
                failedEvals++;
                continue;
            }

            const genData = await genResponse.json();
            const generatedCard = genData.result;

            if (!generatedCard) {
                console.log(`✗ ${topic} / ${tone} — Generation Failed (Missing result)`);
                failedEvals++;
                continue;
            }

            // Step 2: Ask the LLM Judge to evaluate the card
            const systemPrompt = `You are an expert AI evaluator. You will be given a requested topic, a requested tone, and a generated social card (JSON).
Evaluate the card on a scale of 1 to 5 for the following criteria:
- relevance: Does the card meaningfully relate to the requested topic?
- tone: Does it follow the requested tone?
- coherence: Is the content clear and logically understandable?
- conciseness: Is it appropriately short for a social card?
- hashtag_quality: Are the hashtags relevant to the topic?
- overall: Overall quality score (1-5).

Return ONLY a JSON object matching this schema:
{
  "relevance": number,
  "tone": number,
  "coherence": number,
  "conciseness": number,
  "hashtag_quality": number,
  "overall": number,
  "reason": "brief explanation of the scores"
}`;

            const userPrompt = `Requested Topic: "${topic}"\nRequested Tone: "${tone}"\n\nGenerated Card:\n${JSON.stringify(generatedCard, null, 2)}`;

            const judgePayload = {
                model: "openai/gpt-oss-20b",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                max_tokens: 512,
                temperature: 0.1 // Low temperature for more consistent judging
            };

            const judgeResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify(judgePayload)
            });

            if (!judgeResponse.ok) {
                console.log(`✗ ${topic} / ${tone} — Judge API Failed (HTTP ${judgeResponse.status})`);
                failedEvals++;
                continue;
            }

            const judgeData = await judgeResponse.json();
            const rawJudgeOutput = judgeData?.choices?.[0]?.message?.content ?? "{}";

            let parsedJudgeOutput;
            try {
                parsedJudgeOutput = JSON.parse(rawJudgeOutput);
            } catch (e) {
                console.log(`✗ ${topic} / ${tone} — Judge returned malformed JSON`);
                failedEvals++;
                continue;
            }

            const validation = judgeSchema.safeParse(parsedJudgeOutput);
            if (!validation.success) {
                console.log(`✗ ${topic} / ${tone} — Judge output failed schema validation`);
                failedEvals++;
                continue;
            }

            const result = validation.data;

            // Record scores
            scores.relevance.push(result.relevance);
            scores.tone.push(result.tone);
            scores.coherence.push(result.coherence);
            scores.conciseness.push(result.conciseness);
            scores.hashtag_quality.push(result.hashtag_quality);
            scores.overall.push(result.overall);

            console.log(`✓ ${topic} / ${tone} — ${result.overall}/5`);
            console.log(`  Relevance: ${result.relevance} | Tone: ${result.tone} | Coherence: ${result.coherence} | Conciseness: ${result.conciseness} | Hashtags: ${result.hashtag_quality}`);

            successfulEvals++;

        } catch (error) {
            console.log(`✗ ${topic} / ${tone} — Execution Error: ${error.message}`);
            failedEvals++;
        }

        // Configurable delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    // Calculate averages
    const calcAvg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "0.0";

    console.log('\nSemantic AI Evaluation (LLM-Judge Scores)');
    console.log('─────────────────────────────────────────');
    console.log(`Tests evaluated: ${successfulEvals}/${testCases.length}`);
    console.log(`Failed evaluations: ${failedEvals}\n`);

    if (successfulEvals > 0) {
        console.log(`Relevance:        ${calcAvg(scores.relevance)} / 5`);
        console.log(`Tone adherence:   ${calcAvg(scores.tone)} / 5`);
        console.log(`Coherence:        ${calcAvg(scores.coherence)} / 5`);
        console.log(`Conciseness:      ${calcAvg(scores.conciseness)} / 5`);
        console.log(`Hashtag quality:  ${calcAvg(scores.hashtag_quality)} / 5`);
        console.log(`Overall:          ${calcAvg(scores.overall)} / 5\n`);
    }

    if (failedEvals > 0) {
        console.error(`Semantic evaluation finished with ${failedEvals} errors.`);
        process.exit(1);
    } else {
        console.log('Semantic evaluation completed successfully.');
        process.exit(0);
    }
}

runSemanticEvaluation();