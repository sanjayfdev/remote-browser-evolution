import puppeteer from "puppeteer";

export async function launchBrowser(urlToOpen) {
  console.log(`🔍 Attempting to open URL: "${urlToOpen}"`);

  if (!urlToOpen || !urlToOpen.startsWith("http")) {
    console.warn("⚠️ Invalid URL. Falling back to default.");
    urlToOpen = "https://www.google.com";
  }


  process.env.DISPLAY = ":99";

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: false, // REQUIRED for X11
    defaultViewport: null, 
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--window-position=0,0",
      "--window-size=1024,576",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-features=CalculateNativeWinOcclusion",
      "--disable-extensions",
      "--disable-infobars",
      // "--kiosk",
    ],
  });

  // ✅ Always create your own page
  const page = await browser.newPage();
  const pages = await browser.pages();
  console.log(pages);

  // ✅ Explicit viewport = FFmpeg capture size
  await page.setViewport({
    width: 1024,
    height: 576,
    deviceScaleFactor: 1,
  });
  

  try {
    await page.goto(urlToOpen, { waitUntil: "domcontentloaded" });
    console.log("✅ Browser navigated successfully");
  } catch (err) {
    console.error("❌ Page navigation failed");
    throw err;
  }

  return { browser, page };
}
