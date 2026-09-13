# Boxing Coach AI

A web app that uses AI to teach you boxing step by step.

## Features
- 🥊 AI-powered boxing coaching chat
- 🎯 Structured learning paths (beginner to advanced)
- 📱 Responsive design (mobile + desktop)
- 🌐 Bilingual support (Persian / English)
- 💬 Real-time conversation with GPT API

## Tech Stack
- Frontend: Vanilla HTML/CSS/JS (no framework needed yet)
- AI: OpenAI GPT-4o API
- Storage: localStorage for chat history

## Setup
1. Copy `.env.example` to `.env`
2. Add your OpenAI API key
3. Open `index.html` in a browser (or serve with any static server)

```
npx serve .
# or
python -m http.server 8080
```

### API Key
Get one at https://platform.openai.com/api-keys

## Roadmap
- [ ] Voice input/output (speech recognition)
- [ ] Video demonstration library
- [ ] Training plans & progress tracking
- [ ] Push notifications for daily training
- [ ] User accounts & saved progress
