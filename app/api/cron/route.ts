import { NextResponse } from "next/server";

import {
  getLowestPrice,
  getHighestPrice,
  getAveragePrice,
  getEmailNotifType,
} from "@/lib/utils";

import { connectDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 300;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // ⛔ Skip execution during build, but KEEP TYPE SAFETY
  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.json({ message: "Cron skipped during build" });
  }

  try {
    await connectDB();

    const products = await Product.find({});
    if (!products.length) {
      return NextResponse.json({ message: "No products found" });
    }

    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        const scraped = await scrapeAmazonProduct(currentProduct.url);
        if (!scraped) return currentProduct;

        // ✅ FULL NORMALIZATION (TYPE SAFE)
        const normalized = {
          url: scraped.url,
          title: scraped.title ?? "",
          image: scraped.image ?? "",
          currentPrice: scraped.currentPrice ?? 0,
          originalPrice: scraped.originalPrice ?? 0,
          currency: scraped.currency ?? "₹",
          category: scraped.category ?? "",
          priceHistory: currentProduct.priceHistory.concat({
            price: scraped.currentPrice ?? 0,
            date: new Date(),
          }),
          lowestPrice: getLowestPrice(currentProduct.priceHistory),
          highestPrice: getHighestPrice(currentProduct.priceHistory),
          averagePrice: getAveragePrice(currentProduct.priceHistory),
          isOutOfStock: scraped.isOutOfStock ?? false,
          description: scraped.description ?? "",
          discountRate: scraped.discountRate ?? 0,
          stars: scraped.stars ?? 0, // ⭐ REQUIRED
        };

        const updatedProduct = await Product.findOneAndUpdate(
          { url: normalized.url },
          normalized,
          { new: true }
        );

        // ✅ CRITICAL FIX: NEVER pass `scraped`
        const emailNotifType = getEmailNotifType(
          normalized,
          currentProduct
        );

        if (emailNotifType && updatedProduct?.users?.length) {
          const emailContent = await generateEmailBody(
            {
              title: updatedProduct.title,
              url: updatedProduct.url,
            },
            emailNotifType
          );

          const emails = updatedProduct.users.map(
            (u: any) => u.email
          );

          await sendEmail(emailContent, emails);
        }

        return updatedProduct;
      })
    );

    return NextResponse.json({
      message: "Cron executed successfully",
      data: updatedProducts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
