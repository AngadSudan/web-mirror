import puppeteer from "puppeteer";
import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Browser Utilities
 */
class BrowserUtils {
  static async openInBrowser(filePath) {
    const fullPath = path.resolve(filePath);
    const fileUrl = `file://${fullPath.replace(/\\/g, "/")}`;

    console.log(`🚀 Opening in browser: ${fileUrl}`);

    const platform = process.platform;
    let command, args;

    if (platform === "darwin") {
      command = "open";
      args = [fileUrl];
    } else if (platform === "win32") {
      command = "cmd";
      args = ["/c", "start", '""', fileUrl];
    } else {
      command = "xdg-open";
      args = [fileUrl];
    }

    try {
      const child = spawn(command, args, {
        detached: true,
        stdio: "ignore",
        shell: platform === "win32",
      });

      child.on("error", (err) => {
        console.error("❌ Failed to open browser:", err.message);
        console.log(`Please manually open: ${fileUrl}`);
      });

      child.unref();

      setTimeout(() => {
        console.log("✅ Browser opened successfully");
      }, 1000);
    } catch (err) {
      console.error("❌ Failed to open browser:", err.message);
      console.log(`Please manually open: ${fileUrl}`);
    }
  }
}
export default BrowserUtils;
