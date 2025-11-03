# AI Interview Coach

An AI-powered mock interview platform built with **TypeScript**, **React**, and **TailwindCSS**.  
Users can select different interview roles — such as **Web Developer**, **AI Learner**, or **Product Manager** — and experience realistic interviews with live camera, voice recording, and AI feedback.

---

## 🚀 Features

- 🎯 **Role-Based Interviews** — Choose your preferred role and get tailored interview questions.  
- 🧠 **AI Evaluation Engine** — Uses **OpenRouter AI** for intelligent response analysis and scoring.  
- 🎙️ **Voice Interaction** — Integrated with **ElevenLabs** for realistic text-to-speech and voice evaluation.  
- 📷 **Camera & Audio Support** — Record answers in real-time with webcam and mic access.  
- 📊 **Performance Feedback** — Get insights on tone, clarity, and confidence from AI.  
- 💡 **Modern UI/UX** — Built using React + TailwindCSS for a clean and responsive design.  

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React, TypeScript, Vite |
| Styling | TailwindCSS |
| AI Backend | OpenRouter API |
| Voice | ElevenLabs API |
| State Management | React Hooks / Context API |
| Build Tool | Vite |
| Deployment | Vercel |

---

## ⚙️ Installation & Setup

### Clone the repository
```bash
git clone https://github.com/vibek01/AI_INTERVIEW_COACH.git
cd AI_INTERVIEW_COACH
```

### Install dependencies
```bash
npm install
```

### Set up environment variables
Create a `.env` file in the project root and add the following:
```text
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Run the app
```bash
npm run dev
```
Then open the app at **http://localhost:5173**

---

## 🧠 How It Works

1. User selects a role (e.g., *Web Developer*).  
2. The app fetches tailored interview questions using the **OpenRouter AI model**.  
3. User answers using mic and camera; the response is recorded and analyzed.  
4. The AI evaluates tone, confidence, and content quality.  
5. **ElevenLabs** generates natural voice responses for the interviewer.  
6. The final feedback and performance summary are displayed on-screen.  

---

## 🧑‍💻 Authors

**Vibek Prasad Bin**  
https://github.com/vibek10  
**Prantik Nath**  
https://github.com/prntkk  
**Shubham Sinha**  
https://github.com/shubhamsinha10-04  
**Akash Debnath**  

Building intelligent and interactive AI-driven web experiences ⚡

---

### 🌟 Star this repo if you found it useful!
```