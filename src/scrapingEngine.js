import puppeteer from "puppeteer";
import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import FileDownloader from "./fileDownload.js";
import AssetProcessor from "./assetProcessor.js";
import LinkProcessor from "./LinkProcessor.js";
import PathUtils from "./pathUtils.js";
import BrowserUtils from "./browserUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ScraperState {
  constructor() {
    this.visitedUrls = new Set();
    this.urlQueue = [];
    this.urlToFileMap = new Map();
    this.baseUrl = "";
    this.baseDomain = "";
    this.saveDir = "";
    this.siteName = "";
  }

  reset() {
    this.visitedUrls.clear();
    this.urlQueue.length = 0;
    this.urlToFileMap.clear();
    this.baseUrl = "";
    this.baseDomain = "";
    this.saveDir = "";
    this.siteName = "";
  }

  initializeFromUrl(targetUrl) {
    try {
      const urlObj = new URL(targetUrl);
      this.baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      this.baseDomain = urlObj.hostname;

      // Extract site name from domain (e.g., piyushgarg.dev -> piyushgarg)
      this.siteName = this.baseDomain.split(".")[0];
      this.saveDir = path.resolve("./scraped-website", this.siteName);

      this.urlQueue.push(targetUrl);
      return true;
    } catch (err) {
      console.error("❌ Invalid URL provided:", targetUrl);
      return false;
    }
  }
}

/**
 * Main Scraping Engine
 */
class WebScraper {
  constructor() {
    this.state = new ScraperState();
    this.browser = null;
  }

  async initializeBrowser() {
    this.browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapePage(url) {
    if (this.state.visitedUrls.has(url)) {
      return;
    }

    console.log(`\n🔍 Scraping: ${url}`);
    this.state.visitedUrls.add(url);

    const page = await this.browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    try {
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 3000000,
      });
    } catch (err) {
      console.error(`❌ Failed to load ${url}:`, err.message);
      await page.close();
      return;
    }

    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);

    // Ensure directory structure
    const assetDirs = FileDownloader.ensureDirectoryStructure(
      this.state.saveDir
    );

    // Process all assets
    await AssetProcessor.processCSSFiles(
      $,
      url,
      this.state.saveDir,
      this.state.baseUrl,
      assetDirs
    );
    await AssetProcessor.processJSFiles(
      $,
      url,
      this.state.saveDir,
      this.state.baseUrl,
      assetDirs
    );
    await AssetProcessor.processImages(
      $,
      url,
      this.state.saveDir,
      this.state.baseUrl,
      assetDirs
    );
    await AssetProcessor.processOtherAssets(
      $,
      url,
      this.state.saveDir,
      this.state.baseUrl,
      assetDirs
    );

    // Process internal links
    LinkProcessor.processInternalLinks($, url, this.state);
    LinkProcessor.fixRelativeLinks($, this.state);

    // Save HTML file
    await this.saveHtmlFile($, url);
    await page.close();
  }

  async saveHtmlFile($, url) {
    const localPath =
      PathUtils.urlToLocalPath(url, this.state.baseUrl) || "index.html";
    const htmlPath = path.join(this.state.saveDir, localPath);

    const htmlDir = path.dirname(htmlPath);
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir, { recursive: true });
    }

    let updatedHtml = $.html();

    if (
      !updatedHtml.startsWith("<!DOCTYPE") &&
      !updatedHtml.startsWith("<!doctype")
    ) {
      updatedHtml = "<!DOCTYPE html>\n" + updatedHtml;
    }

    updatedHtml = updatedHtml.replace(/(<html[^>]*>)/i, "$1\n");

    fs.writeFileSync(htmlPath, updatedHtml, "utf-8");
    console.log(`✅ Saved HTML: ${localPath}`);

    this.state.urlToFileMap.set(url, localPath);
  }

  async scrapeWebsite(targetUrl, options = {}) {
    const { maxDepth = 3, concurrency = 3 } = options;

    // Initialize state
    if (!this.state.initializeFromUrl(targetUrl)) {
      throw new Error("Invalid URL provided");
    }

    console.log(`🔍 Starting recursive scrape of: ${targetUrl}`);
    console.log(`🎯 Domain: ${this.state.baseDomain}`);
    console.log(`📊 Max depth: ${maxDepth}`);
    console.log(`📁 Saving to: ${this.state.saveDir}`);

    await this.initializeBrowser();

    let currentDepth = 0;

    while (this.state.urlQueue.length > 0 && currentDepth < maxDepth) {
      const currentBatchSize = this.state.urlQueue.length;
      const batch = this.state.urlQueue.splice(0, currentBatchSize);

      console.log(
        `\n🌊 Processing depth ${currentDepth + 1} (${batch.length} URLs)`
      );

      // Process batch with limited concurrency
      await this.processBatch(batch, concurrency);
      currentDepth++;
    }

    await this.closeBrowser();

    // Print statistics and open browser
    this.printStatistics(targetUrl, currentDepth);
    await this.openMainPage(targetUrl);

    return {
      visitedUrls: this.state.visitedUrls.size,
      remainingUrls: this.state.urlQueue.length,
      maxDepthReached: currentDepth,
      saveDirectory: this.state.saveDir,
    };
  }

  async processBatch(batch, concurrency) {
    const batchPromises = [];

    for (let i = 0; i < batch.length; i += concurrency) {
      const batchSlice = batch.slice(i, i + concurrency);
      const promises = batchSlice.map((url) => this.scrapePage(url));
      batchPromises.push(...promises);

      if (batchPromises.length >= concurrency) {
        await Promise.all(batchPromises.splice(0, concurrency));
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (batchPromises.length > 0) {
      await Promise.all(batchPromises);
    }
  }

  printStatistics(targetUrl, currentDepth) {
    console.log(`\n🎉 Recursive scraping completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   ├── URLs visited: ${this.state.visitedUrls.size}`);
    console.log(`   ├── URLs remaining: ${this.state.urlQueue.length}`);
    console.log(`   └── Max depth reached: ${currentDepth}`);
    console.log(`\n📁 Files saved in: ${this.state.saveDir}`);
    console.log(`📁 Structure:`);
    console.log(`   ├── index.html (and other HTML pages)`);
    console.log(`   └── assets/`);
    console.log(`       ├── styles/ (CSS files)`);
    console.log(`       ├── scripts/ (JavaScript files)`);
    console.log(`       ├── images/ (Image files)`);
    console.log(`       └── misc/ (Other assets)`);
  }

  async openMainPage(targetUrl) {
    const mainPage = path.join(
      this.state.saveDir,
      this.state.urlToFileMap.get(targetUrl) || "index.html"
    );
    await BrowserUtils.openInBrowser(mainPage);
  }

  // Public API methods for agentic AI
  async scrapeUrl(url, options = {}) {
    return await this.scrapeWebsite(url, options);
  }

  async scrapeSinglePage(url, saveDir = null) {
    if (saveDir) {
      this.state.saveDir = saveDir;
    } else {
      if (!this.state.initializeFromUrl(url)) {
        throw new Error("Invalid URL provided");
      }
    }

    await this.initializeBrowser();
    await this.scrapePage(url);
    await this.closeBrowser();

    return {
      savedPath: this.state.urlToFileMap.get(url),
      saveDirectory: this.state.saveDir,
    };
  }

  getScrapingState() {
    return {
      visitedUrls: Array.from(this.state.visitedUrls),
      queuedUrls: [...this.state.urlQueue],
      baseUrl: this.state.baseUrl,
      baseDomain: this.state.baseDomain,
      saveDirectory: this.state.saveDir,
      siteName: this.state.siteName,
    };
  }

  resetScraper() {
    this.state.reset();
  }
}

export default WebScraper;
