import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

  const url = "https://www.test.com.test";
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const productNodes = await page.$$("div.product"); // Select all nodes with class 'product'
  const productDetailsArray = [];
  for (const productNode of productNodes) {
    const imagePath = await page.evaluate(
      (element) =>
        element.querySelector('a[itemprop="image"]')?.getAttribute("href") ||
        "No Image",
      productNode
    );
    //generate array for product_data.json
    const productDetails = await page.evaluate((element) => {
      const dataId = element.getAttribute("data-id");
      const titleElement = element.querySelector('span[itemprop="name"]');
      const descriptionElement = element.querySelector(
        'div[itemprop="description"]'
      );
      const priceElement = element.querySelector('span[itemprop="price"]');
      const weightElement = element.querySelector(".weight");
      // Assuming size is within a <select> tag with options having the class '.sod_option'
      const sizeOptionElements = element.querySelectorAll(".sod_option");
      const sizeOptions = Array.from(sizeOptionElements).map((option) =>
        option.textContent.trim()
      );

      // Check if elements exist before accessing properties
      const title = titleElement ? titleElement.textContent : "No Title";
      const description = descriptionElement
        ? descriptionElement.textContent
        : "No Description";
      const price = priceElement ? priceElement.textContent.trim() : "No Price";
      const size = sizeOptions.length > 0 ? sizeOptions.join(", ") : "No Size";
      const weight = weightElement
        ? weightElement.textContent.trim()
        : "No Weight";

      const imageElement = element.querySelector('a[itemprop="image"]');
      const imageName = imageElement
        ? imageElement.getAttribute("href")
        : "No Image";
      const sourceFilename = imageName;
      const filename = imageName?.match(/\/([^\/?#]+)\?/)?.[1] || "No Image";

      return {
        dataId,
        title,
        description,
        price,
        size,
        weight,
        sourceFilename,
        filename,
      };
    }, productNode);

    if (imagePath !== "No Image") {
      productDetailsArray.push(productDetails);
    }
  }

  const outputFileName = "test_data_main.json";
  fs.writeFileSync(
    outputFileName,
    JSON.stringify(productDetailsArray, null, 2)
  );

  await browser.close();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const folderName = "imagestest";
  const folderPath = path.join(__dirname, folderName);

  for (const productNode of productDetailsArray) {

    const imageFullUrl = url + productNode.sourceFilename;
    const outputPath = path.join(folderPath, productNode.filename);

    (async () => {
      const browser = await puppeteer.launch({
        headless: "new",
      });

      const page = await browser.newPage();

      await page.goto(imageFullUrl, { waitUntil: "networkidle0" });

      // Evaluate function to get the image source
      const imageUrlFromPage = await page.evaluate(() => {
        const imgElement = document.querySelector("img");
        return imgElement ? imgElement.src : null;
      });

      if (imageUrlFromPage) {
        // Download the image
        const imageBuffer = await page.screenshot({ encoding: "binary" });

        // Save the image to the 'images' folder
        fs.writeFileSync(outputPath, imageBuffer, "binary");

        console.log(`Image saved to: ${outputPath}`);
      } else {
        console.error("Failed to retrieve image URL from the page.");
      }

      await browser.close();
    })();
  }
})();
