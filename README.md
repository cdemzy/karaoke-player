# Karaoke

A web-based karaoke app built for searching for songs, build a queue, and play them one by one for your crowd.

## Tech Stack

| Package | Version |
|---|---|
| Next.js | 16.2.4 |
| React | 19.2.4 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Motion | 12.38.0 |
| React Icons | 5.6.0 |
| Vercel Analytics | 2.0.1 |

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env.local`**
   ```
   YOUTUBE_API_KEY=your_key_here
   APP_PASSWORD=your_password_here
   ```
   - Get a YouTube Data API v3 key from [Google Cloud Console](https://console.cloud.google.com)
   - `APP_PASSWORD` protects the app from public access and prevents unauthorized API quota usage

3. **Run locally**
   ```bash
   npm run dev
   ```

## Deployment (Vercel)

Add environment variables in your Vercel project settings.
```
YOUTUBE_API_KEY=your_key_here
APP_PASSWORD=your_password_here
```
