'use server';

import { connectDB } from '../mongoose';
import Product from '../models/product.model';
import { scrapeAmazonProduct } from '../scraper';

export async function getProduct(asin: string) {
  await connectDB();

  const url = `https://www.amazon.in/dp/${asin}`;
  const scraped = await scrapeAmazonProduct(url);
  if (!scraped) throw new Error('Scraping failed');

  const existing = await Product.findOne({ url });

  const priceEntry = scraped.currentPrice
    ? { price: scraped.currentPrice }
    : null;

  const priceHistory = priceEntry
    ? existing
      ? [...existing.priceHistory, priceEntry]
      : [priceEntry]
    : existing?.priceHistory || [];

  const product = await Product.findOneAndUpdate(
    { url },
    {
      ...scraped,
      priceHistory,
      lowestPrice:
        scraped.currentPrice && existing
          ? Math.min(existing.lowestPrice ?? scraped.currentPrice, scraped.currentPrice)
          : scraped.currentPrice,
      highestPrice:
        scraped.currentPrice && existing
          ? Math.max(existing.highestPrice ?? scraped.currentPrice, scraped.currentPrice)
          : scraped.currentPrice,
      averagePrice:
        scraped.currentPrice && existing
          ? Math.round((existing.averagePrice + scraped.currentPrice) / 2)
          : scraped.currentPrice,
    },
    { upsert: true, new: true }
  );

  return product.toObject(); // ✅ IMPORTANT
}
