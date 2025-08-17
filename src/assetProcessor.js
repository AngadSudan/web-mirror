import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import PathUtils from "./pathUtils.js";
import FileDownloader from "./fileDownload.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AssetProcessor {
  static async processCSSFiles($, url, saveDir, baseUrl, assetDirs) {
    const processedCssFiles = new Set();
    const cssLinks = $("link[rel='stylesheet']");

    for (let i = 0; i < cssLinks.length; i++) {
      const el = cssLinks[i];
      let cssUrl = $(el).attr("href");
      if (!cssUrl || cssUrl.startsWith("data:")) continue;

      try {
        const absoluteUrl = new URL(cssUrl, url).href;
        const urlObj = new URL(absoluteUrl);
        let fileName = path.basename(urlObj.pathname) || `style${i + 1}.css`;

        if (!fileName.endsWith(".css")) {
          fileName = `style${i + 1}.css`;
        }

        fileName = PathUtils.sanitizeFilename(fileName);
        let uniqueFileName = this.generateUniqueFileName(
          fileName,
          processedCssFiles
        );
        processedCssFiles.add(uniqueFileName);

        const filePath = path.join(assetDirs.styles, uniqueFileName);
        const success = await FileDownloader.downloadFile(
          absoluteUrl,
          filePath
        );

        if (success) {
          const relativeToPage = PathUtils.calculateAssetPath(
            url,
            filePath,
            saveDir,
            baseUrl
          );
          $(el).attr("href", relativeToPage);
          console.log(`🔗 Updated CSS path: ${relativeToPage}`);
        }
      } catch (err) {
        console.error(`❌ Error processing CSS ${cssUrl}:`, err.message);
      }
    }
  }

  static async processJSFiles($, url, saveDir, baseUrl, assetDirs) {
    const processedJsFiles = new Set();
    const jsLinks = $("script[src]");

    for (let i = 0; i < jsLinks.length; i++) {
      const el = jsLinks[i];
      let jsUrl = $(el).attr("src");
      if (!jsUrl || jsUrl.startsWith("data:")) continue;

      try {
        const absoluteUrl = new URL(jsUrl, url).href;
        const urlObj = new URL(absoluteUrl);
        let fileName = path.basename(urlObj.pathname) || `script${i + 1}.js`;

        const ext = PathUtils.getFileExtension(absoluteUrl);
        if (!fileName.includes(".")) {
          fileName = `script${i + 1}${ext}`;
        }

        fileName = PathUtils.sanitizeFilename(fileName);
        let uniqueFileName = this.generateUniqueFileName(
          fileName,
          processedJsFiles
        );
        processedJsFiles.add(uniqueFileName);

        const filePath = path.join(assetDirs.scripts, uniqueFileName);
        const success = await FileDownloader.downloadFile(
          absoluteUrl,
          filePath
        );

        if (success) {
          const relativeToPage = PathUtils.calculateAssetPath(
            url,
            filePath,
            saveDir,
            baseUrl
          );
          $(el).attr("src", relativeToPage);
          console.log(`🔗 Updated JS path: ${relativeToPage}`);
        }
      } catch (err) {
        console.error(`❌ Error processing JS ${jsUrl}:`, err.message);
      }
    }
  }

  static async processImages($, url, saveDir, baseUrl, assetDirs) {
    const images = $("img[src]");

    for (let i = 0; i < images.length; i++) {
      const el = images[i];
      let imgUrl = $(el).attr("src");
      if (!imgUrl || imgUrl.startsWith("data:")) continue;

      try {
        const absoluteUrl = new URL(imgUrl, url).href;
        const urlObj = new URL(absoluteUrl);
        let fileName = path.basename(urlObj.pathname);

        if (!fileName || !fileName.includes(".")) {
          const ext = path.extname(urlObj.pathname) || ".jpg";
          fileName = `image${i + 1}${ext}`;
        }

        fileName = PathUtils.sanitizeFilename(fileName);
        const filePath = path.join(assetDirs.images, fileName);
        const success = await FileDownloader.downloadFile(
          absoluteUrl,
          filePath
        );

        if (success) {
          const relativeToPage = PathUtils.calculateAssetPath(
            url,
            filePath,
            saveDir,
            baseUrl
          );
          $(el).attr("src", relativeToPage);
        }
      } catch (err) {
        console.error(`❌ Error processing image ${imgUrl}:`, err.message);
      }
    }

    // Remove srcset attributes
    $("img").each((_, el) => {
      if ($(el).attr("srcset")) {
        $(el).removeAttr("srcset");
      }
    });
  }

  static async processOtherAssets($, url, saveDir, baseUrl, assetDirs) {
    const assets = $(
      "link[rel*='icon'], link[rel='apple-touch-icon'], link[rel='manifest']"
    );

    for (let i = 0; i < assets.length; i++) {
      const el = assets[i];
      let assetUrl = $(el).attr("href");
      if (!assetUrl || assetUrl.startsWith("data:")) continue;

      try {
        const absoluteUrl = new URL(assetUrl, url).href;
        const urlObj = new URL(absoluteUrl);
        let fileName = path.basename(urlObj.pathname) || `asset${i + 1}`;

        fileName = PathUtils.sanitizeFilename(fileName);
        const filePath = path.join(assetDirs.misc, fileName);
        const success = await FileDownloader.downloadFile(
          absoluteUrl,
          filePath
        );

        if (success) {
          const relativeToPage = PathUtils.calculateAssetPath(
            url,
            filePath,
            saveDir,
            baseUrl
          );
          $(el).attr("href", relativeToPage);
        }
      } catch (err) {
        console.error(`❌ Error processing asset ${assetUrl}:`, err.message);
      }
    }
  }

  static generateUniqueFileName(fileName, processedFiles) {
    let uniqueFileName = fileName;
    let counter = 1;

    while (processedFiles.has(uniqueFileName)) {
      const name = path.parse(fileName).name;
      const ext = path.parse(fileName).ext;
      uniqueFileName = `${name}_${counter}${ext}`;
      counter++;
    }

    return uniqueFileName;
  }
}
export default AssetProcessor;
