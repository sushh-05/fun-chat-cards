# Fun Chat Cards 🎀 
A playful, cherry-themed React + Vite web app powered by **Groq LLaMA-3.1** that generates fun, short AI-crafted social cards.  
Lightweight, fast, and perfect as a demo project for internship applications.

---

## Features ✨
- ⚡ **Instant AI-generated chat cards**
- 🍒 **Modern UI** 
- 🤖 **Groq LLaMA-3.1 8B Instant** — totally free to use
- 🎨 Clean & aesthetic layout perfect for screenshots
- 🧠 Smart JSON-based generation for:
  - Title  
  - Emoji  
  - Body text  
  - Hashtags

---

## Preview
<img width="975" height="508" alt="image" src="https://github.com/user-attachments/assets/f38bf42c-12f1-41dc-81b1-08b2ec69429f" />


---

## Tech Stack
- **React 18**
- **Vite**
- **Groq API**
- **Axios**
- **Modern CSS (custom styling)**

---

## 📂 Project Structure
<img width="167" height="339" alt="image" src="https://github.com/user-attachments/assets/a0fd6792-6ab5-4144-bb0e-fb8975aea1ea" />


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
npm run dev


Your app will open at your local host.

## How It Works
The app sends your topic to Groq's LLaMA-3.1 8B Instant model using a clean structured prompt.
The model returns a JSON object like:

{
  "title": "Coffee Chaos",
  "emoji": "☕",
  "body": "When your brain says focus, but your coffee says nope.",
  "hashtags": ["coffee", "relatable"]
}


The UI turns it into a polished social card with emojis + hashtags.

## 🛠 Future Enhancements

- Save card as image (download PNG)

- Random topic generator

- Theme toggle

- Share card on socials

- Vercel serverless API for secure key handling

## 🤝 Contributing

PRs and suggestions are welcome!

## License

MIT License — free to use & modify.

## Author
Sushmitha Thadi
Fun mini-project built for learning & internship applications.



