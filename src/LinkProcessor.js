import puppeteer from "puppeteer";
import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import PathUtils from "./pathUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Link Processing Tools
 */
class LinkProcessor {
  static processInternalLinks($, url, state) {
    const links = $("a[href]");

    for (let i = 0; i < links.length; i++) {
      const el = links[i];
      let linkUrl = $(el).attr("href");
      if (!linkUrl) continue;

      try {
        const absoluteUrl = new URL(linkUrl, url).href;

        if (
          this.isSameDomain(absoluteUrl, state.baseDomain, state.baseUrl) &&
          !state.visitedUrls.has(absoluteUrl)
        ) {
          if (
            this.shouldQueueUrl(absoluteUrl) &&
            !state.urlQueue.includes(absoluteUrl)
          ) {
            state.urlQueue.push(absoluteUrl);
            console.log(`📋 Queued: ${absoluteUrl}`);
          }
        }

        // Update link to point to local file
        if (this.isSameDomain(absoluteUrl, state.baseDomain, state.baseUrl)) {
          const localPath = PathUtils.urlToLocalPath(
            absoluteUrl,
            state.baseUrl
          );
          if (localPath) {
            const currentPagePath =
              PathUtils.urlToLocalPath(url, state.baseUrl) || "index.html";
            const relativePath = PathUtils.convertUrlToRelative(
              currentPagePath,
              absoluteUrl,
              state.baseUrl
            );
            $(el).attr("href", relativePath);
          }
        }
      } catch (err) {
        // Keep original link if conversion fails
      }
    }
  }

  static isSameDomain(url, baseDomain, baseUrl) {
    try {
      const urlObj = new URL(url, baseUrl);
      return urlObj.hostname === baseDomain;
    } catch {
      return false;
    }
  }

  static shouldQueueUrl(url) {
    return (
      !url.match(/\.(pdf|zip|exe|dmg|jpg|jpeg|png|gif|svg|ico|css|js)$/i) &&
      !url.includes("#") &&
      !url.includes("mailto:") &&
      !url.includes("tel:")
    );
  }

  static fixRelativeLinks($, state) {
    // Fix root-relative links
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("/") && href.length > 1) {
        $(el).attr(
          "href",
          `${state.siteName}/` + href.substring(1) + "_index.html"
        );
      } else if (href === "/") {
        $(el).attr("href", "index_index.html");
      }
    });

    // Fix asset paths for _next and similar patterns
    $("link[rel='stylesheet'], script[src], link[rel='preload']").each(
      (_, el) => {
        let attr = $(el).attr("href") || $(el).attr("src");
        if (attr && attr.startsWith("/_next")) {
          const fileName = attr.split("/").pop();
          if ($(el).attr("href")) $(el).attr("href", "assets/" + fileName);
          if ($(el).attr("src")) $(el).attr("src", "assets/" + fileName);
        }
      }
    );
  }
}
export default LinkProcessor;
