import puppeteer from "puppeteer";

export async function scrapeAmazonProduct(url: string) {
  if (!url) return null;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-IN,en;q=0.9",
  });

  console.log("Opening Amazon page...");
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  console.log("Amazon page loaded");

  const data = await page.evaluate(() => {
    const getText = (sel: string) =>
      document.querySelector(sel)?.textContent?.trim() || "";

    const getImage = () => {
      return (
        (document.querySelector("#landingImage") as HTMLImageElement)?.src ||
        (document.querySelector("#imgBlkFront") as HTMLImageElement)?.src ||
        (document.querySelector(
          'img[data-old-hires]'
        ) as HTMLImageElement)?.getAttribute("data-old-hires") ||
        (document.querySelector("img") as HTMLImageElement)?.src ||
        ""
      );
    };

    const priceText =
      getText(".a-price .a-offscreen") ||
      getText(".a-price-whole") ||
      getText("#priceblock_ourprice") ||
      getText("#priceblock_dealprice");

    const price = priceText
      ? Number(priceText.replace(/[₹,]/g, "").trim())
      : 0;

    return {
      title: getText("#productTitle"),
      image: getImage(),
      currentPrice: price,
      currency: "₹",
      category: "product",
    };
  });

  await browser.close();

  // ✅ NORMALIZED, STRICT-TYPE-SAFE RETURN
  return {
    url,
    title: data.title || "",
    image: data.image || "",
    currentPrice: data.currentPrice || 0,
    originalPrice: data.currentPrice || 0,
    currency: data.currency || "₹",
    category: data.category || "product",

    priceHistory: data.currentPrice
      ? [{ price: data.currentPrice, date: new Date() }]
      : [],

    lowestPrice: data.currentPrice || 0,
    highestPrice: data.currentPrice || 0,
    averagePrice: data.currentPrice || 0,

    isOutOfStock: !data.currentPrice,
    description: "",
    reviewsCount: 0,
    discountRate: 0,
    stars: 0, // ⭐ REQUIRED FOR TS + VERCEL
  };
}
