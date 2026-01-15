# Deployment Checklist

## ✅ Pre-Deployment

- [ ] All dependencies installed (`npm install`)
- [ ] App runs locally without errors (`npm run dev`)
- [ ] Environment variables configured in `.env.local`
- [ ] Code committed to Git
- [ ] Repository pushed to GitHub

## 🔑 API Keys Obtained

- [ ] **Gemini API Key** (Required)
  - Get from: https://aistudio.google.com/app/apikey
  - Added to `.env.local`
  
- [ ] **Supabase** (Optional - for cloud features)
  - [ ] Account created at https://supabase.com
  - [ ] New project created
  - [ ] Database tables created (see SETUP_GUIDE.md)
  - [ ] URL and anon key copied
  - [ ] Added to `.env.local`

- [ ] **Auth0** (Optional - for advanced auth)
  - [ ] Account created at https://auth0.com
  - [ ] Application created
  - [ ] Callback URLs configured
  - [ ] Domain and Client ID copied
  - [ ] Added to `.env.local`

## 🚀 Vercel Deployment

- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Project imported to Vercel
- [ ] Build settings configured:
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] Environment variables added in Vercel:
  - [ ] `GEMINI_API_KEY`
  - [ ] `VITE_SUPABASE_URL` (if using Supabase)
  - [ ] `VITE_SUPABASE_ANON_KEY` (if using Supabase)
  - [ ] `AUTH0_DOMAIN` (if using Auth0)
  - [ ] `AUTH0_CLIENT_ID` (if using Auth0)
- [ ] Deployment successful
- [ ] Live URL obtained

## 🔧 Post-Deployment

- [ ] Auth0 callback URLs updated with live URL (if using Auth0)
- [ ] Test the live site:
  - [ ] App loads correctly
  - [ ] Can upload PDF
  - [ ] Can create test package
  - [ ] Can take test
  - [ ] Analytics work
- [ ] No console errors in browser
- [ ] Mobile responsiveness checked

## 📝 Optional Enhancements

- [ ] Custom domain configured in Vercel
- [ ] Analytics added (Google Analytics, etc.)
- [ ] Error monitoring (Sentry, etc.)
- [ ] Performance monitoring
- [ ] SEO optimization

## 🎉 Launch!

- [ ] Share with users
- [ ] Gather feedback
- [ ] Monitor for issues
- [ ] Plan next features

---

**Estimated Time:** 30-45 minutes for full setup
**Minimum Time:** 5 minutes for basic local setup
