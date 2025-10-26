# Vercel Deployment Guide for YarnFlow

## 📋 Overview
This guide explains how to deploy the YarnFlow frontend to Vercel with proper environment variables.

## 🔐 Important: Environment Variables

### What NOT to Do:
❌ **DO NOT** push `.env.development` or `.env.production` files to GitHub
❌ **DO NOT** commit sensitive API URLs or keys to the repository

### What TO Do:
✅ Configure environment variables directly in Vercel Dashboard
✅ Keep `.env` files in `.gitignore`

---

## 🚀 Step-by-Step Deployment Process

### Step 1: Push Your Code to GitHub

```bash
# Make sure you're on your feature branch
git add .
git commit -m "Add environment configuration for Vercel deployment"
git push origin feature/simplified-masterdataModule
```

### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository: `vishalsinhparmar/YarnFlow`
4. Select the repository

### Step 3: Configure Project Settings

#### Framework Preset:
- Select: **Vite**

#### Root Directory:
- Set to: `client` (since your frontend is in the client folder)

#### Build Settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

In the Vercel project settings, add the following environment variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_BASE_URL` | `https://yarnflow-production.up.railway.app/api` | Production |

#### How to Add:
1. In Vercel Dashboard → Your Project
2. Go to **Settings** tab
3. Click **Environment Variables** (left sidebar)
4. Add new variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://yarnflow-production.up.railway.app/api`
   - **Environments**: Check ✅ Production, ✅ Preview
5. Click **Save**

### Step 5: Deploy

1. Click **Deploy** button
2. Wait for build to complete (2-3 minutes)
3. Vercel will provide you a URL like: `https://yarn-flow-xyz.vercel.app`

---

## 🔄 How Environment Variables Work

### Local Development (Your Computer):
```bash
npm run dev
```
- Uses: `.env.development`
- API URL: `http://localhost:3050/api`
- Connects to your local Express server

### Production (Vercel):
```bash
npm run build (Vercel runs this automatically)
```
- Uses: Environment variables from Vercel Dashboard
- API URL: `https://yarnflow-production.up.railway.app/api`
- Connects to your Railway production server

---

## 📊 Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│  LOCAL DEVELOPMENT                                      │
├─────────────────────────────────────────────────────────┤
│  1. npm run dev                                         │
│  2. Vite reads: .env.development                        │
│  3. VITE_API_BASE_URL = http://localhost:3050/api       │
│  4. Frontend → Local Express Server                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  PRODUCTION (VERCEL)                                    │
├─────────────────────────────────────────────────────────┤
│  1. Push code to GitHub                                 │
│  2. Vercel auto-builds                                  │
│  3. Reads env vars from Vercel Dashboard                │
│  4. VITE_API_BASE_URL = Railway production URL          │
│  5. Frontend → Railway Express Server                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Issue 1: API calls fail after deployment
**Solution**: Check that `VITE_API_BASE_URL` is set correctly in Vercel Dashboard

### Issue 2: Environment variable not working
**Solution**: 
- Make sure variable name starts with `VITE_`
- Redeploy after adding environment variables
- Check browser console for the logged API URL

### Issue 3: CORS errors
**Solution**: Make sure your Railway Express server allows requests from your Vercel domain:
```javascript
// In your Express server
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:5173']
}));
```

---

## 📝 Checklist Before Deployment

- [ ] `.env.development` and `.env.production` are in `.gitignore`
- [ ] Code is pushed to GitHub
- [ ] Vercel project is connected to GitHub repo
- [ ] Root directory is set to `client`
- [ ] `VITE_API_BASE_URL` is added in Vercel Dashboard
- [ ] Railway backend server is running
- [ ] CORS is configured on backend to allow Vercel domain

---

## 🎯 Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production (test locally)
npm run build
npm run preview

# Push to GitHub
git add .
git commit -m "Your message"
git push origin your-branch-name
```

---

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify environment variables in Vercel Dashboard
4. Ensure Railway backend is accessible

---

**Last Updated**: October 26, 2025
**Project**: YarnFlow
**Frontend**: Vercel
**Backend**: Railway
