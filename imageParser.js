import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const folderName = 'images';
const folderPath = path.join(__dirname, folderName);

// Ensure the 'images' folder exists
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

const imageUrl = 'https://www.test.com.test/upload/test/test/test.JPG';
const outputPath = path.join(folderPath, 'testImagePath.jpg');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(imageUrl, { waitUntil: 'networkidle0' });

  // Evaluate function to get the image source
  const imageUrlFromPage = await page.evaluate(() => {
    const imgElement = document.querySelector('img');
    return imgElement ? imgElement.src : null;
  });

  if (imageUrlFromPage) {
    // Download the image
    const imageBuffer = await page.screenshot({ encoding: 'binary' });

    // Save the image to the 'images' folder
    fs.writeFileSync(outputPath, imageBuffer, 'binary');

    console.log(`Image saved to: ${outputPath}`);
  } else {
    console.error('Failed to retrieve image URL from the page.');
  }

  await browser.close();
})();
