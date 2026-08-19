# Fun Chat Cards 🎀 [![Live Demo](https://img.shields.io/badge/Live-Demo-ff3563?style=for-the-badge)](https://fun-chat-cards.vercel.app/)

or https://fun-chat-cards.vercel.app/


A playful, cherry-themed React + Vite web app powered by **Groq API** that generates fun, short AI-crafted social cards. 

---

## Features ✨
- ⚡ **Instant AI-generated chat cards**
- 🍒 **Modern UI** 
- 🌗 **Light & Dark modes** 
- 🐦 **Animated Vanta.js Birds background**
- 🎭 **Tone selector** (Playful, Sarcastic, Inspirational, Professional, Gen-Z)
- 📐 **Format-aware layouts** (Auto, 1:1 Square, 4:5 Portrait, 16:9 Landscape)
- 🔤 **Customizable card fonts** (Sans-serif, Serif, Monospace, Handwriting)
- ✏️ **Editable card text** (click to edit title, body, or tags)
- 🏷️ **Custom Handle/Watermark** support
- 🎨 **AI-generated color themes** for each card
- 🕒 **Card History** (automatically saves your last 10 cards)
- 🔀 **Random topic generator** & Trending chips
- 📸 **Save card as image (PNG)** with pixel-perfect export dimensions
- 📋 **Copy Image & Copy Text** directly to clipboard
- 🔗 **Share card on social platforms**
- 🎉 **Confetti animations & Sound effects**
- 🤖 **Groq API (openai/gpt-oss-20b)** (fast & free)
- 🧠 Smart JSON-based generation for:
  - Title  
  - Emoji  
  - Short body text  
  - Hashtags
  - Color theme
- 📱 **Screenshot-ready cards** (social media friendly)
---

## Preview
<img width="981" height="468" alt="image" src="https://github.com/user-attachments/assets/35d7e195-a651-46b2-bed5-544d6b915880" />

---

## Tech Stack
- **React 18**
- **Vite**
- **Groq API (openai/gpt-oss-20b)**
- **Axios**
- **Framer Motion** (animations)
- **Vanta.js & Three.js** (background)
- **html2canvas** (image export)
- **canvas-confetti**
- **Custom modern CSS** (no UI frameworks)

---

## 📂 Project Structure
<img width="154" height="377" alt="image" src="https://github.com/user-attachments/assets/7593eb6f-6ea3-43a0-aeba-a05537ca1749" />

---

## Installation & Setup

### 1️⃣ Clone the repository
git clone https://github.com/sushh-05/fun-chat-cards.git

cd fun-chat-cards

### 2️⃣ Install dependencies
npm install

### 3️⃣ Add your Groq API key

Create a .env file in the root:

VITE_GROQ_API_KEY=your_groq_key_here


Create a free key here:
https://console.groq.com/keys

### 4️⃣ Run the app

npm install

npm run dev


Your app will open at your local host.

## How It Works
The app sends your topic and selected tone to Groq's API using a clean structured prompt.
The model returns a JSON object like:

{
  "title": "Coffee Chaos",
  "emoji": "☕",
  "body": "When your brain says focus, but your coffee says nope.",
  "hashtags": ["coffee", "relatable"],
  "color": "#6f4e37"
}


The UI turns it into a polished, animated social card with emojis, hashtags, and a matching color theme.

## 🌍 Deployment

🚀 Live Demo: https://fun-chat-cards.vercel.app/

This project is deployed for free using **Vercel**.


## 🤝 Contributing

PRs and suggestions are welcome!

## License

MIT License — free to use & modify.

## Author
Sushmitha Thadi

Fun mini-project built for learning & internship applications.



