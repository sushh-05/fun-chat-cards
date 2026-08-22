# Fun Chat Cards 🎀 [![Live Demo](https://img.shields.io/badge/Live-Demo-ff3563?style=for-the-badge)](https://fun-chat-cards.vercel.app/)

**Live Demo:** [https://fun-chat-cards.vercel.app/](https://fun-chat-cards.vercel.app/)

A React + Vite web application powered by **Groq's Llama 3.1 API** that generates short, highly-stylized social cards. This project serves as an AI engineering portfolio piece, demonstrating secure LLM integration, strict structured output validation, automated retry mechanisms, and custom evaluation harnesses.

---

## 🚀 Key Features

- **AI-Generated Content**: Instantly generates a title, body, emoji, hashtags, and a matching hex color theme based on a topic and tone.
- **Robust AI Pipeline**: Server-side API key protection, Zod schema validation, and automatic LLM retry logic.
- **Customizable UI**: Light/Dark modes, editable card text, custom fonts, aspect ratios, and handle/watermark support.
- **Export & Share**: Save cards as pixel-perfect PNGs or share directly to social platforms.
- **Delightful UX**: Framer Motion animations, Vanta.js interactive backgrounds, and canvas confetti.

---

## 🏗️ Architecture & Request Flow

The application enforces a strict separation between the client-side UI and the AI generation logic to ensure security and reliability.

```text
                 ┌──────────────────┐
                 │   React + Vite   │
                 │    Frontend      │
                 └────────┬─────────┘
                          │
                    POST /api/generate
                          │
                          ▼
                 ┌──────────────────┐
                 │ Vercel Function  │
                 │  Secure Backend  │
                 └────────┬─────────┘
                          │
                    Groq API
                          │
                          ▼
                 ┌──────────────────┐
                 │   Llama Model    │
                 └────────┬─────────┘
                          │
                    JSON response
                          │
                          ▼
                 ┌──────────────────┐
                 │ JSON Parse + Zod │
                 │    Validation    │
                 └────────┬─────────┘
                          │
                   failure? ──────► retry
                          │
                        valid
                          │
                          ▼
                 ┌──────────────────┐
                 │ Validated Card   │
                 └────────┬─────────┘
                          │
                          ▼
                    React UI
```

### Request Flow
1. **React Frontend**: User submits a topic and tone.
2. **`/api/generate`**: The request is sent to a secure Vercel serverless function.
3. **Groq Llama**: The backend securely calls the Groq API, enforcing a `json_object` response format.
4. **JSON Output**: The LLM returns a raw JSON string.
5. **Zod Validation**: The backend parses the JSON and strictly validates it against a predefined Zod schema.
6. **Retry/Timeout Handling**: If the JSON is malformed, fails validation, or times out, the backend automatically adjusts the prompt and retries exactly once.
7. **Validated Response**: A guaranteed, type-safe object is returned to the frontend.

---

## 🧠 AI Engineering Details

- **Structured JSON Generation**: Utilizes Groq's `response_format: { type: "json_object" }` alongside strict system prompts to guarantee structured data.
- **Zod Schema Validation**: Every LLM response is validated server-side to ensure required fields (title, body, emoji, hashtags) exist and meet length/type constraints.
- **Retry Logic**: Implements a bounded retry loop (max 2 attempts). If validation fails, the retry prompt dynamically informs the LLM of its specific schema violations.
- **Timeout Handling**: Uses `AbortController` to prevent hanging requests, capping LLM execution at 10 seconds.
- **Error Handling**: Gracefully catches and translates upstream errors (e.g., 429 Rate Limit, 502 Bad Gateway) into clean HTTP responses for the frontend.
- **Server-Side API Key Protection**: The Groq API key is strictly isolated in the Vercel serverless environment and never exposed to the browser.
- **Observability/Logging**: Logs lightweight, privacy-safe metrics (timestamps, attempt counts, latencies, and failure categories) without exposing raw prompts or PII.

---

## 📊 Evaluation Results

The project includes a custom, developer-facing evaluation harness to measure pipeline reliability and semantic quality across 20 diverse test cases (including edge cases, prompt injections, and various tones).

### Reliability Evaluation
Measures HTTP success, schema validity, and latency.
- **Test cases**: 20
- **Successful**: 20/20
- **Schema-valid**: 20/20
- **Success rate**: 100%
- **Average latency**: 2.33s
- **P95 latency**: 3.01s

### Semantic Evaluation (LLM-as-a-Judge)
Uses a separate LLM judge to score the generated cards on a 1-5 scale. *(Note: 2 infrastructure/API failures occurred during this run; scores are based on the 18 successfully evaluated cases).*
- **Relevance**: 4.9 / 5
- **Tone adherence**: 4.1 / 5
- **Coherence**: 5.0 / 5
- **Conciseness**: 4.7 / 5
- **Hashtag quality**: 5.0 / 5
- **Overall**: 4.8 / 5

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite, Custom CSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI/LLM**: Groq API (Llama 3.1 / `openai/gpt-oss-20b`)
- **Validation**: Zod
- **UI Libraries**: Framer Motion, Vanta.js, Three.js, canvas-confetti, html2canvas

---

## 📂 Project Structure

```text
├── api/
│   └── generate.js          # Secure serverless backend & LLM logic
├── evaluation/
│   ├── runEval.js           # Reliability evaluation script
│   ├── runSemanticEval.js   # Semantic (LLM-judge) evaluation script
│   └── testCases.js         # 20 diverse test cases
├── src/
│   ├── components/
│   │   └── Card.jsx         # Main card UI component
│   ├── utils/
│   ├── App.jsx              # Main application state & UI
│   └── index.css            # Custom styling
├── .env.example             # Environment variable template
└── package.json
```

---

## 🛠️ Local Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/sushh-05/fun-chat-cards.git
cd fun-chat-cards
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Copy the example environment file to create your own `.env` file:
```bash
cp .env.example .env
```
Open `.env` and add your Groq API key (get a free key at [console.groq.com](https://console.groq.com/keys)):
```env
GROQ_API_KEY=your_groq_key_here
```

### 4. Running the Application
Because the app uses a Vercel Serverless Function for the backend, use the Vercel CLI for local development:
```bash
npm i -g vercel
vercel dev
```
The app will be available at `http://localhost:3000`.

---

## 🧪 Running Evaluations

The evaluation scripts test the actual HTTP boundary of the application. **Ensure your local dev server (`vercel dev`) is running in a separate terminal before executing these.**

### Running Reliability Evaluation
Tests schema adherence, error handling, and latency.
```bash
npm run eval
```

### Running Semantic Evaluation
Uses an LLM judge to score the quality of the generated cards.
```bash
npm run eval:semantic
```

*Note: To avoid Groq free-tier rate limits during evaluation, you can increase the delay between requests (default is 3000ms):*
```bash
EVAL_DELAY_MS=5000 npm run eval
```

---

## 🤝 Contributing
PRs and suggestions are welcome!

## License
MIT License — free to use & modify.

## Author
Sushmitha Thadi
