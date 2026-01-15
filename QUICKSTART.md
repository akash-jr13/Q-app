# Quick Start - Q-app

## ⚡ Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Gemini API Key
1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### 3. Configure Environment
Open `.env.local` and add your key:
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Run the App
```bash
npm run dev
```

### 5. Open Browser
Navigate to: http://localhost:5173

---

## 🎯 What Can You Do?

### Without Cloud Setup (Local Mode)
✅ Create test packages from PDFs
✅ Take timed tests
✅ View detailed analytics
✅ Track progress locally
✅ Manage test series

### With Supabase (Cloud Mode)
✅ All local features +
✅ Cloud sync across devices
✅ Global leaderboards
✅ User authentication
✅ Persistent storage

---

## 🚀 Deploy to Vercel (Optional)

### Quick Deploy
1. Push code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your repository
5. Add environment variables:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL` (optional)
   - `VITE_SUPABASE_ANON_KEY` (optional)
6. Click "Deploy"

**Done!** Your app is live in ~2 minutes.

---

## 📖 Full Documentation

For detailed setup instructions, see:
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup guide
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Architecture details

---

## 🆘 Troubleshooting

**App won't start?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Missing API key error?**
- Check `.env.local` exists in project root
- Verify `GEMINI_API_KEY` is set
- Restart dev server

**PDF not loading?**
- Use valid PDF files
- Check browser console for errors
- Try a different PDF

---

## 🎓 Next Steps

1. ✅ Run the app locally
2. 📄 Upload a PDF test paper
3. ✂️ Create your first test package
4. 📝 Take a practice test
5. 📊 View your analytics

**Need help?** Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.
