# 🕸️ Web Scraping Agent

This project is a **Node.js-based web scraping and site downloader tool** that allows you to crawl, process, and save static versions of websites locally.

It uses a modular structure with utilities for downloading assets, processing links, handling file paths, and managing the scraping engine.

## 📂 Project Structure

```
├── node_modules/          # Dependencies
├── scraped-website/      # Downloaded website output
├── src/                  # Source code
│   ├── assetProcessor.js # Handles static assets (JS, CSS, images)
│   ├── browserUtils.js   # Puppeteer/Playwright helpers (if used)
│   ├── fileDownload.js   # File downloading utilities
│   ├── index.js         # Entry point
│   ├── LinkProcessor.js  # Processes links & rewrites them locally
│   ├── pathUtils.js     # File path utilities
│   ├── scrapingEngine.js # Core scraping logic
│   └── scrapingToll.js  # CLI/Tool runner
├── .env.example         # Example environment variables
├── .gitignore
├── bun.lock            # Bun lockfile (if using Bun)
├── package.json        # Dependencies & scripts
└── package-lock.json   # NPM lockfile
```

## 🚀 Features

- Download and save a website locally
- Rewrite internal links to relative paths
- Save assets like JS, CSS, and images
- Handle Next.js/React/SPA builds by pre-rendering
- Simple modular code for easy extension

## ⚙️ Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/your-username/agent.git
cd agent
npm install
```

Or if you're using Bun:

```bash
bun install
```

## ▶️ Usage

Run the scraper with:

```bash
node src/index.js
```

If you're using Bun:

```bash
bun run src/index.js
```

Scraped websites will be saved inside the `scraped-website/` folder.

## 🔧 Configuration

You can configure scraping settings inside `.env` (copy from `.env.example`):

```env
BASE_URL=https://example.com
OUTPUT_DIR=./scraped-website
```

## 📜 Scripts

Common scripts you can add to `package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "scrape": "node src/scrapingToll.js"
  }
}
```

Run with:

```bash
npm run scrape
```

## 📌 Notes

- Works best on websites with static builds (e.g., Next.js, Gatsby, static exports)
- For fully dynamic SPAs, Puppeteer/Playwright integration may be required
- Make sure to respect websites' robots.txt and terms of service

## 📝 License

MIT License © 2025 Your Name
