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
 * File Download Utilities
 */
class FileDownloader {
  static async downloadFile(url, filePath) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, response.data);
      console.log(
        `✅ Saved: ${path.relative(path.dirname(filePath), filePath)}`
      );
      return true;
    } catch (err) {
      console.error(`❌ Failed to download ${url}:`, err.message);
      return false;
    }
  }

  static ensureDirectoryStructure(saveDir) {
    const directories = [
      path.join(saveDir, "assets", "styles"),
      path.join(saveDir, "assets", "scripts"),
      path.join(saveDir, "assets", "images"),
      path.join(saveDir, "assets", "misc"),
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    return {
      styles: directories[0],
      scripts: directories[1],
      images: directories[2],
      misc: directories[3],
    };
  }
}
export default FileDownloader;
