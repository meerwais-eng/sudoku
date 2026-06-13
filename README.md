# Sudoku Prime

A modern, feature-rich Sudoku Progressive Web App (PWA) built with Next.js. Play unlimited Sudoku puzzles offline, track your stats, compete on leaderboards, and install it as a native app on any device — including Android via Capacitor.

## Features

- 🧩 **Infinite Puzzles** — Auto-generated grids across four difficulty levels (Easy, Medium, Hard, Expert)
- 📱 **Installable PWA** — Works offline, installs to your home screen on iOS, Android, and desktop
- 🤖 **Native Android** — Build as an Android APK/AAB via Capacitor for Google Play distribution
- 🏆 **Leaderboards & Achievements** — Cloud-synced via Supabase with Row Level Security
- 🌙 **Dark Mode** — Respects system preference with manual toggle
- ⌨️ **Keyboard & Touch** — Full keyboard shortcuts plus touch/click number pad
- ✏️ **Notes/Pencil Marks** — Toggle pencil mode to annotate candidates in each cell
- ↩️ **Undo/Redo** — Full move history with unlimited undo and redo
- 💡 **Hints** — Get a hint revealing the next logical deduction
- 📊 **Statistics** — Per-difficulty stats, streaks, best times, and completion rates
- 🎨 **Beautiful UI** — Built with Tailwind CSS v4, Radix UI primitives, and Lucide icons

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Backend | [Supabase](https://supabase.com/) (Auth, DB, RLS) |
| Mobile | [Capacitor 8](https://capacitorjs.com/) (Android) |
| Ads (Android) | [Capacitor AdMob](https://github.com/capacitor-community/admob) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v22 or later
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/mirwais-eng/sudoku.git
cd sudoku

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Environment Variables

Create a `.env.local` file with your Supabase credentials (needed for leaderboards and achievements):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The app **works fully offline** without Supabase — puzzles, stats, and settings are stored locally. Only online features (leaderboards, achievement sync) require Supabase.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production SSR build (for Vercel) |
| `npm run build:pwa` | Build targeting PWA output |
| `npm run build:android` | Build + sync with Capacitor Android |
| `npm run build:pages` | Static export for GitHub Pages |
| `npm run export:pages` | Static export + local preview |
| `npm run preview` | Serve static export locally |
| `npm run build:aab` | Build Android App Bundle |
| `npm run build:apk` | Build Android APK |
| `npm run cap:sync` | Sync web assets to Android project |
| `npm run cap:open` | Open Android Studio |
| `npm run generate:icons` | Generate PWA icon set |
| `npm run generate:android-icons` | Generate Android icon set |
| `npm run generate:keystore` | Generate Android signing keystore |
| `npm run lint` | Run ESLint |

## Deployment

### Vercel (Recommended)

The project includes [`vercel.json`](./vercel.json) for zero-config deployment:

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add Supabase environment variables
4. Deploy

Every push to `main` triggers automatic deployment.

### GitHub Pages

For static hosting via GitHub Pages, see the full instructions in [DEPLOYMENT.md](./DEPLOYMENT.md).

### Android (Google Play)

```bash
npm run build:android    # Build and sync
npm run cap:open         # Open in Android Studio
```

From Android Studio: **Build → Generate Signed Bundle / APK**. See [`scripts/`](./scripts/) for helper scripts.

## Project Structure

```
sudoku-prime/
├── src/
│   ├── app/              # Next.js App Router pages & layouts
│   ├── components/       # React components (UI primitives, game board, etc.)
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities, types, game logic, Supabase client
├── public/               # Static assets, PWA manifest, service worker, icons
├── android/              # Capacitor Android project
├── scripts/              # Build & icon generation scripts
├── vercel.json           # Vercel deployment config
├── next.config.ts        # Next.js configuration (SSR + static export)
├── capacitor.config.ts   # Capacitor configuration
├── tailwind.config.ts    # Tailwind CSS theme
└── DEPLOYMENT.md         # Detailed deployment guide
```

## License

This project is open source. See the license file for details (if applicable).

---

Built with ❤️ using Next.js, React, and Tailwind CSS.