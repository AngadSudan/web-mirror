import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import WebScraper from "./scrapingEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function scrapingTool(targetUrl, maxDepth) {
  const scraper = new WebScraper();

  try {
    await scraper.scrapeWebsite(targetUrl, { maxDepth });

    return "website scrapped";
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

// Error handling
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled promise rejection:", err.message);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\n👋 Interrupted by user");
  process.exit(0);
});

// Run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
}

export default scrapingTool;
