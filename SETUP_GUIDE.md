# Q-app - Complete Setup Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Getting API Keys](#getting-api-keys)
4. [Supabase Setup](#supabase-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Features](#features)

---

## 🎯 Project Overview

**Q-Studio** is a comprehensive test preparation platform with:
- **PDF Question Mapper**: Create test packages from PDF files
- **Test Taker Interface**: Take tests with timer and analytics
- **Progress Tracking**: Monitor performance over time
- **Test Series Management**: Organize multiple test series
- **Neural Audit**: AI-powered performance analysis
- **Cloud Sync**: Optional Supabase integration for data persistence

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- A Gemini API key (required)
- Supabase account (optional, for cloud features)
- Vercel account (optional, for deployment)

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Open `.env.local`
   - Add your Gemini API key (see [Getting API Keys](#getting-api-keys))
   - Optionally add Supabase credentials

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:5173`

---

## 🔑 Getting API Keys

### 1. Gemini API Key (REQUIRED)

**Step-by-step:**

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Click **"Create API key in new project"** (or select existing project)
5. Copy the generated API key
6. Paste it in `.env.local`:
   ```bash
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**Important Notes:**
- Keep this key secret - never commit it to GitHub
- The free tier includes generous limits for testing
- Required for AI-powered question analysis features

---

### 2. Supabase Credentials (OPTIONAL)

**What it enables:**
- Cloud storage for test packages
- User authentication and profiles
- Global leaderboards
- Cross-device sync

**Step-by-step:**

1. Go to [Supabase](https://supabase.com)
2. Click **"Start your project"** and sign up
3. Create a new project:
   - Choose a project name (e.g., "q-app")
   - Set a strong database password (save this!)
   - Select a region close to you
   - Click **"Create new project"**
4. Wait 2-3 minutes for project setup
5. Go to **Settings** → **API**
6. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
7. Update `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**Next:** Set up database tables (see [Supabase Setup](#supabase-setup))

---

### 3. Auth0 Credentials (OPTIONAL)

**What it enables:**
- Advanced user authentication
- Social login (Google, GitHub, etc.)
- User management dashboard

**Step-by-step:**

1. Go to [Auth0](https://auth0.com)
2. Sign up and create a new tenant
3. Create a new application:
   - Click **Applications** → **Create Application**
   - Name: "Q-app"
   - Type: **Single Page Web Applications**
   - Click **Create**
4. Configure application:
   - Go to **Settings** tab
   - Add to **Allowed Callback URLs**: `http://localhost:5173, https://your-domain.vercel.app`
   - Add to **Allowed Logout URLs**: `http://localhost:5173, https://your-domain.vercel.app`
   - Add to **Allowed Web Origins**: `http://localhost:5173, https://your-domain.vercel.app`
   - Click **Save Changes**
5. Copy credentials:
   - **Domain** → `AUTH0_DOMAIN`
   - **Client ID** → `AUTH0_CLIENT_ID`
6. Update `.env.local`:
   ```bash
   AUTH0_DOMAIN=dev-xxxxxxxxxx.us.auth0.com
   AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## 🗄️ Supabase Setup

### Database Schema

If you're using Supabase, you need to create the database tables:

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Create test_attempts table for storing test results
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  score NUMERIC NOT NULL,
  accuracy NUMERIC NOT NULL,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_name ON test_attempts(test_name);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);

-- Create function to get global test statistics
CREATE OR REPLACE FUNCTION get_global_test_stats(
  target_test_name TEXT,
  user_score NUMERIC
)
RETURNS TABLE (
  rank BIGINT,
  percentile NUMERIC,
  total_attempts BIGINT,
  avg_score NUMERIC,
  top_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      AVG(score) as average,
      MAX(score) as maximum,
      COUNT(*) FILTER (WHERE score > user_score) as better_count
    FROM test_attempts
    WHERE test_name = target_test_name
  )
  SELECT 
    (better_count + 1)::BIGINT as rank,
    CASE 
      WHEN total > 0 THEN ROUND(((total - better_count)::NUMERIC / total * 100), 2)
      ELSE 0
    END as percentile,
    total as total_attempts,
    ROUND(average, 2) as avg_score,
    maximum as top_score
  FROM stats;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for anonymous users)
CREATE POLICY "Allow public insert" ON test_attempts
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anyone to read
CREATE POLICY "Allow public read" ON test_attempts
  FOR SELECT USING (true);
```

5. Click **Run** to execute the SQL
6. Verify tables were created by clicking **Table Editor** in the sidebar

---

## 🚀 Vercel Deployment

### Step 1: Prepare Your Project

1. **Create a GitHub repository** (if you haven't already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/akash-jr13/Q-app.git
   git push -u origin main
   ```

2. **Add `.gitignore`** to prevent committing sensitive files:
   ```
   node_modules
   .env.local
   .env
   dist
   .DS_Store
   ```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Add Environment Variables

1. In Vercel project settings, go to **Settings** → **Environment Variables**
2. Add each variable from your `.env.local`:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `GEMINI_API_KEY` | Your Gemini API key | Production, Preview, Development |
   | `VITE_SUPABASE_URL` | Your Supabase URL (optional) | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key (optional) | Production, Preview, Development |
   | `AUTH0_DOMAIN` | Your Auth0 domain (optional) | Production, Preview, Development |
   | `AUTH0_CLIENT_ID` | Your Auth0 client ID (optional) | Production, Preview, Development |

3. Click **Save** for each variable

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. Click **Visit** to see your live site!

### Step 5: Update Auth0 URLs (if using Auth0)

1. Copy your Vercel deployment URL (e.g., `https://q-app.vercel.app`)
2. Go to Auth0 dashboard → Your Application → Settings
3. Update these fields:
   - **Allowed Callback URLs**: Add `https://your-domain.vercel.app`
   - **Allowed Logout URLs**: Add `https://your-domain.vercel.app`
   - **Allowed Web Origins**: Add `https://your-domain.vercel.app`
4. Click **Save Changes**

---

## ✨ Features

### 1. PDF Question Mapper
- Upload PDF test papers
- Crop and annotate questions
- Set difficulty levels and topics
- Export as encrypted test packages

### 2. Test Taker
- Take tests with countdown timer
- Real-time question navigation
- Auto-save answers
- Detailed performance analysis

### 3. Progress Tracking
- View test history
- Track accuracy trends
- Monitor time management
- Identify weak areas

### 4. Test Series
- Organize multiple test series
- Schedule practice tests
- Track series completion
- Compare performance across tests

### 5. Neural Audit (AI-Powered)
- Analyze mistake patterns
- Get personalized recommendations
- Identify knowledge gaps
- Optimize study strategy

---

## 🔧 Troubleshooting

### Build Errors

**Error: "Cannot find module '@auth0/auth0-react'"**
```bash
npm install
```

**Error: "GEMINI_API_KEY is not defined"**
- Make sure `.env.local` exists and has the API key
- Restart the dev server after adding environment variables

### Runtime Errors

**"Cloud Uplink is not configured"**
- This is normal if you haven't set up Supabase
- The app will work in local-only mode

**PDF not loading**
- Make sure you're using a valid PDF file
- Check browser console for specific errors

---

## 📝 Environment Variables Summary

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | ✅ Yes | AI-powered features |
| `VITE_SUPABASE_URL` | ❌ No | Cloud sync and storage |
| `VITE_SUPABASE_ANON_KEY` | ❌ No | Cloud sync and storage |
| `AUTH0_DOMAIN` | ❌ No | User authentication |
| `AUTH0_CLIENT_ID` | ❌ No | User authentication |

---

## 🎓 Next Steps

1. ✅ Get your Gemini API key
2. ✅ Run the app locally
3. ✅ (Optional) Set up Supabase for cloud features
4. ✅ (Optional) Deploy to Vercel
5. 🎉 Start creating and taking tests!

---

## 📞 Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review environment variable configuration
- Ensure all dependencies are installed

---

**Happy Testing! 🚀**
