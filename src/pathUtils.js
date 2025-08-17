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
 * File and Path Utilities
 */
class PathUtils {
  static sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, "_").replace(/\?.*$/, "");
  }

  static getFileExtension(url) {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || ".js";
  }

  static urlToLocalPath(url, baseUrl) {
    try {
      const urlObj = new URL(url, baseUrl);
      let pathname = urlObj.pathname;

      pathname = pathname.replace(/^\/+/, "");
      if (!pathname) pathname = "index";

      if (pathname.endsWith("/")) {
        pathname = pathname + "index.html";
      } else if (!path.extname(pathname) && !pathname.includes(".")) {
        pathname = pathname + "/index.html";
      }

      return this.sanitizeFilename(pathname);
    } catch {
      return null;
    }
  }

  static convertUrlToRelative(fromPath, toUrl, baseUrl) {
    try {
      const toPath = this.urlToLocalPath(toUrl, baseUrl);
      if (!toPath) return toUrl;

      const fromDir = path.dirname(fromPath);
      let relativePath;

      if (fromDir === "." || fromDir === "") {
        relativePath = toPath;
      } else {
        const depth = fromDir.split("/").length;
        const backPath = "../".repeat(depth);
        relativePath = backPath + toPath;
      }

      return relativePath.replace(/\\/g, "/");
    } catch {
      return toUrl;
    }
  }

  static calculateAssetPath(pageUrl, assetFilePath, saveDir, baseUrl) {
    try {
      const pageLocalPath =
        this.urlToLocalPath(pageUrl, baseUrl) || "index.html";
      const pageDir = path.dirname(pageLocalPath);
      const assetRelativeToSaveDir = path.relative(saveDir, assetFilePath);
      const pageDepth = pageDir === "." ? 0 : pageDir.split(path.sep).length;

      let relativePath;
      if (pageDepth === 0) {
        relativePath = assetRelativeToSaveDir;
      } else {
        const backPath = "../".repeat(pageDepth);
        relativePath = backPath + assetRelativeToSaveDir;
      }

      return relativePath.replace(/\\/g, "/");
    } catch (err) {
      console.error("Error calculating asset path:", err.message);
      const fallbackPath = path
        .relative(saveDir, assetFilePath)
        .replace(/\\/g, "/");
      return "./" + fallbackPath;
    }
  }
}
export default PathUtils;
