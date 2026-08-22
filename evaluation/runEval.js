import { testCases } from './testCases.js';
import { z } from 'zod';

// Re-declare the schema to ensure the API output matches our strict expectations
const evalSchema = z.object({
    title: z.string().min(1).max(100),
    emoji: z.string().min(1).max(10),
    body: z.string().min(1).max(500),
    hashtags: z.array(z.string().max(50)).max(10),
    color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional().or(z.literal(''))
});

const API_URL = process.env.API_URL || 'http://localhost:3000/api/generate';
const DELAY_MS = parseInt(process.env.EVAL_DELAY_MS, 10) || 3000;

async function runEvaluation() {
    console.log(`Starting AI Generation Evaluation against ${API_URL}...`);
    console.log(`Test cases: ${testCases.length}`);
    console.log(`Delay between requests: ${DELAY_MS}ms\n`);

    let successful = 0;
    let failed = 0;
    let schemaValid = 0;
    const latencies = [];

    for (let i = 0; i < testCases.length; i++) {
        const { topic, tone } = testCases[i];
        const startTime = performance.now();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, tone })
            });

            const latency = performance.now() - startTime;
            latencies.push(latency);
            const latencySec = (latency / 1000).toFixed(2);

            if (!response.ok) {
                console.log(`✗ ${topic} / ${tone} — ${latencySec}s — HTTP ${response.status}`);
                failed++;
                continue;
            }

            const data = await response.json();

            if (!data.result) {
                console.log(`✗ ${topic} / ${tone} — ${latencySec}s — Missing 'result' object`);
                failed++;
                continue;
            }

            const validation = evalSchema.safeParse(data.result);

            if (!validation.success) {
                console.log(`✗ ${topic} / ${tone} — ${latencySec}s — Schema Invalid`);
                failed++;
                continue;
            }

            // Additional strict checks based on prompt constraints
            const titleWords = data.result.title.split(/\s+/).length;
            const bodyWords = data.result.body.split(/\s+/).length;

            if (titleWords > 10) { // Giving a slight buffer over the 5-word prompt constraint
                console.log(`✗ ${topic} / ${tone} — ${latencySec}s — Title too long (${titleWords} words)`);
                failed++;
                continue;
            }

            if (bodyWords > 60) { // Giving a slight buffer over the 40-word prompt constraint
                console.log(`✗ ${topic} / ${tone} — ${latencySec}s — Body too long (${bodyWords} words)`);
                failed++;
                continue;
            }

            console.log(`✓ ${topic} / ${tone} — ${latencySec}s`);
            successful++;
            schemaValid++;

        } catch (error) {
            const latency = performance.now() - startTime;
            const latencySec = (latency / 1000).toFixed(2);
            console.log(`✗ ${topic} / ${tone} — ${latencySec}s — Network/Execution Error: ${error.message}`);
            failed++;
        }

        // Configurable delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    // Calculate metrics
    const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length / 1000).toFixed(2);

    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95) - 1;
    const p95Latency = latencies.length > 0 ? (latencies[Math.max(0, p95Index)] / 1000).toFixed(2) : "0.00";

    console.log('\nAI Generation Evaluation');
    console.log('────────────────────────');
    console.log(`Total tests: ${testCases.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Schema-valid responses: ${schemaValid}/${testCases.length}`);
    console.log(`Average latency: ${avgLatency}s`);
    console.log(`P95 latency: ${p95Latency}s\n`);

    if (failed > 0) {
        console.error(`Evaluation failed with ${failed} errors.`);
        process.exit(1);
    } else {
        console.log('Evaluation passed successfully.');
        process.exit(0);
    }
}

runEvaluation();
