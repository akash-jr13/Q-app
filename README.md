<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Q-Studio - Test Preparation Platform

> A comprehensive test preparation platform for competitive exam aspirants with PDF question mapping, test taking, and AI-powered analytics.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646cff)](https://vitejs.dev/)

---

## ✨ Features

🎯 **PDF Question Mapper** - Create test packages from PDF files with cropping and annotation  
📝 **Test Taker Interface** - Take timed tests with real-time analytics  
📊 **Progress Tracking** - Monitor performance trends and identify weak areas  
📚 **Test Series Management** - Organize and schedule multiple test series  
🧠 **Neural Audit** - AI-powered mistake analysis and recommendations  
☁️ **Cloud Sync** - Optional Supabase integration for cross-device sync  

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- A Gemini API key ([Get it here](https://aistudio.google.com/app/apikey))

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Open `.env.local`
   - Add your Gemini API key:
     ```bash
     GEMINI_API_KEY=your_actual_api_key_here
     ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Navigate to `http://localhost:5173`

**That's it!** 🎉 You're ready to create and take tests.

---

## 📖 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup guide with API keys and deployment
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Architecture and technical details
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Track your deployment progress

---

## 🔑 API Keys Guide

### Required
- **Gemini API** - For AI-powered features
  - Get from: https://aistudio.google.com/app/apikey
  - Free tier available

### Optional (for cloud features)
- **Supabase** - For cloud sync and storage
  - Get from: https://supabase.com
  - See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for setup instructions
  
- **Auth0** - For advanced authentication
  - Get from: https://auth0.com
  - See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for configuration

---

## 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Quick Deploy Steps:
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables (see [SETUP_GUIDE.md](./SETUP_GUIDE.md))
4. Click Deploy!

**Detailed deployment guide:** [SETUP_GUIDE.md - Vercel Deployment](./SETUP_GUIDE.md#-vercel-deployment)

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **PDF Handling:** PDF.js
- **Storage:** IndexedDB + LocalStorage
- **Cloud (Optional):** Supabase
- **Auth (Optional):** Auth0
- **AI:** Google Gemini

---

## 📁 Project Structure

```
q-studio/
├── components/          # React components
│   ├── mapper/         # PDF question mapping
│   ├── taker/          # Test taking interface
│   └── ...             # Other interfaces
├── context/            # React context providers
├── utils/              # Utility functions
├── App.tsx             # Main app component
├── types.ts            # TypeScript definitions
├── index.tsx           # Entry point
├── index.css           # Global styles
└── .env.local          # Environment variables
```

---

## 🎯 Usage

### 1. Create a Test Package
- Click **"New Project"** in the sidebar
- Upload a PDF test paper
- Crop questions and add metadata
- Export as encrypted package

### 2. Take a Test
- Go to **"Q-Taker"**
- Upload a test package
- Enter password (if encrypted)
- Complete the test with timer

### 3. Analyze Performance
- View results immediately after test
- Check **"Q-History"** for past attempts
- Use **"Q-Progress"** for trends
- Get AI insights with **"Neural Audit"**

---

## 🌐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for AI features |
| `VITE_SUPABASE_URL` | ❌ No | Supabase project URL for cloud sync |
| `VITE_SUPABASE_ANON_KEY` | ❌ No | Supabase anonymous key |
| `AUTH0_DOMAIN` | ❌ No | Auth0 domain for authentication |
| `AUTH0_CLIENT_ID` | ❌ No | Auth0 client ID |

**See [.env.local](./.env.local) for template**

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📊 Features Overview

### PDF Question Mapper
- Upload and render PDF files
- Crop question regions with precision
- Add metadata (difficulty, topic, marks, time)
- Support for MCQ, MSQ, NAT, and Matrix Match questions
- Export as encrypted ZIP packages

### Test Taker
- Password-protected test packages
- Countdown timer with warnings
- Question palette for navigation
- Auto-save answers
- Submit with confirmation

### Analytics
- Score and accuracy calculation
- Time management analysis
- Question-wise breakdown
- Comparison with previous attempts
- Global leaderboards (with Supabase)

### Progress Tracking
- Test history with filters
- Performance trends over time
- Subject-wise analytics
- Streak tracking
- Goal setting

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Google Gemini](https://ai.google.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## 📞 Support

For detailed setup instructions and troubleshooting:
- Read [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Check [QUICKSTART.md](./QUICKSTART.md)
- Review [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)

---

**Built with ❤️ for students preparing for competitive exams**

View your app in AI Studio: https://ai.studio/apps/drive/1c2NwDR5nOvwqXNrwl2SwZvhML_KZaMrW
