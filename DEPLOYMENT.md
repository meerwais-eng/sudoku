# Deployment Guide

This guide covers deploying **Sudoku Prime** to **Vercel** (recommended, SSR) and **GitHub Pages** (static export).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deploy to Vercel (Recommended)](#deploy-to-vercel-recommended)
4. [Deploy to GitHub Pages](#deploy-to-github-pages)
5. [Custom Domain Setup](#custom-domain-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Git](https://git-scm.com/) installed and configured
- A GitHub account
- (Optional) A [Vercel](https://vercel.com) account for SSR deployment
- (Optional) A [Supabase](https://supabase.com) project (if using leaderboards/achievements)

---

## Environment Variables

The project uses Supabase for online features (leaderboards, achievements sync). Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Base path for GitHub Pages (only needed for static export)
# Example: "/sudoku" if deploying to username.github.io/sudoku/
NEXT_PUBLIC_BASE_PATH=
```

> **Security Note:** Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. The anon key is safe for client-side use with Supabase Row Level Security (RLS).

---

## Deploy to Vercel (Recommended)

Vercel provides SSR (Server-Side Rendering), API routes, and edge functions — the best experience for this Next.js app.

### Step 1: Push to GitHub

```bash
# Initialize repository (if not already done)
git init
git add .
git commit -m "Initial commit: Sudoku Prime"

# Create a repo on GitHub, then push
git remote add origin https://github.com/YOUR_USERNAME/sudoku-prime.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Continue with GitHub** and authorize Vercel
3. Select the `sudoku-prime` repository
4. The project uses [`vercel.json`](./vercel.json) — Vercel auto-detects the Next.js framework

### Step 3: Configure Environment Variables

In the Vercel project dashboard:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Step 4: Deploy

- Click **Deploy** — Vercel builds and deploys automatically
- Every push to `main` triggers a new deployment
- Preview deployments are created for pull requests

**Your app will be live at:** `https://sudoku-prime.vercel.app`

### Production Checklist

1. Add a custom domain in Vercel Dashboard → Project → Domains
2. Configure Supabase CORS to allow your domain
3. (Optional) Enable Vercel Analytics for usage insights

---

## Deploy to GitHub Pages

GitHub Pages hosts static files only. The app exports as a fully static PWA with offline support.

### Step 1: Configure Repository

1. **Create a new repository** on GitHub (e.g., `sudoku-prime`)
2. **Push your code:**

```bash
git remote add origin https://github.com/YOUR_USERNAME/sudoku-prime.git
git branch -M main
git push -u origin main
```

3. **Set the base path** in GitHub → Settings → Secrets and variables → Actions → Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_BASE_PATH` | `/sudoku-prime` (must match your repo name exactly) |

### Step 2: Enable GitHub Pages

1. Go to your repository → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow file at [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) handles the rest

### Step 3: Trigger Deployment

- Push to `main` automatically triggers the workflow
- Or go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**

### Step 4: Verify Deployment

1. After the workflow completes, go to **Settings** → **Pages**
2. You'll see: _"Your site is live at `https://YOUR_USERNAME.github.io/sudoku-prime/`"_
3. Wait a few minutes for DNS propagation

### Local Build Test

To test the static export locally:

```bash
npm run build:pages    # Build static export into ./out/
npm run preview        # Serve ./out/ locally at http://localhost:3000
```

### GitHub Pages Limitations

- ❌ No server-side rendering (SSR)
- ❌ No API routes
- ❌ No middleware/edge functions
- ✅ All client-side features work (PWA, offline, games)
- ✅ Supabase client-side queries work
- ✅ Service worker registration works

---

## Custom Domain Setup

### Vercel

1. Go to Vercel Dashboard → Project → **Domains**
2. Enter your domain (e.g., `sudoku.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions
4. Update `metadataBase` in [`src/app/layout.tsx`](./src/app/layout.tsx) if needed

### GitHub Pages

1. Go to **Settings** → **Pages** → **Custom domain**
2. Enter your domain
3. Add a CNAME record at your DNS provider pointing to `YOUR_USERNAME.github.io`
4. Enable **Enforce HTTPS** after DNS propagates
5. Update `NEXT_PUBLIC_BASE_PATH` to empty string (root domain)

---

## Troubleshooting

| Problem | Solution |
|---|---|
| **Build fails: "Module not found"** | Run `npm ci` locally to verify dependencies, then check for missing imports |
| **GitHub Pages: 404 on page reload** | The [`next.config.ts`](./next.config.ts) sets `trailingSlash: true` for static export. Ensure SPA redirect isn't needed (this app uses client-side routing) |
| **Supabase: CORS errors** | In Supabase Dashboard → Authentication → Settings, add your deployment URL to the **Allowed Origins** list |
| **PWA doesn't install** | Ensure the site is served over HTTPS (both Vercel and GitHub Pages provide this) |
| **Service worker not registering** | Check browser console. The SW requires HTTPS or localhost. Clear site data and reload |
| **Static export: "Image Optimization" error** | The [`next.config.ts`](./next.config.ts) disables `images.unoptimized` for static exports automatically |
| **Vercel: Function timeout** | This app doesn't use API routes, so timeouts shouldn't occur. If adding them, keep under 10s (Hobby plan) |
| **GitHub Actions: Permission denied** | Go to Settings → Actions → General → Workflow permissions → select **Read and write permissions** |

---

## File Reference

| File | Purpose |
|---|---|
| [`next.config.ts`](./next.config.ts) | Dual-mode config: SSR (Vercel) or static export (GitHub Pages) |
| [`vercel.json`](./vercel.json) | Vercel deployment settings, headers, caching |
| [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) | GitHub Actions workflow for Pages deployment |
| [`.env.local`](./.env.local) | Local environment variables (git-ignored) |
| [`package.json`](./package.json) | Scripts including `build:pages` and `preview` |
| [`public/manifest.json`](./public/manifest.json) | PWA manifest for installable web app |
| [`public/sw.js`](./public/sw.js) | Service worker for offline caching |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────┐
│                   User Browser                      │
├────────────────────────────────────────────────────┤
│  Vercel (SSR)  │  GitHub Pages (Static)  │  PWA    │
│  ✓ API Routes  │  ✓ Client-side only     │  ✓      │
│  ✓ SSR/SSG     │  ✓ Offline via SW       │  ✓      │
│  ✓ Edge Fn     │  ✗ No server code       │  ✓      │
├────────────────────────────────────────────────────┤
│              Supabase (Backend)                     │
│         Leaderboards · Achievements · Auth          │
├────────────────────────────────────────────────────┤
│           Content Delivery (CDN/Edge)               │
└────────────────────────────────────────────────────┘
```

---

## Quick Reference

```bash
# Development
npm run dev                # Start dev server at http://localhost:3000

# Production build (Vercel)
npm run build              # SSR build for Vercel

# Static export (GitHub Pages)
npm run build:pages        # Export to ./out/

# Preview static export locally
npm run preview            # Serve ./out/ directory

# Android (Capacitor)
npm run build:android      # Build + sync Android
npx cap open android       # Open in Android Studio
```

---

> **Need help?** Open an issue on the repository or refer to:
> - [Next.js Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)
> - [Vercel Documentation](https://vercel.com/docs)
> - [GitHub Pages Docs](https://docs.github.com/en/pages)