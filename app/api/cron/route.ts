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
  try {
    // 1️⃣ Connect to MongoDB
    await connectDB();

    // 2️⃣ Fetch all products
    const products = await Product.find({});
    if (!products.length) {
      return NextResponse.json({ message: "No products found" });
    }

    // 3️⃣ Process each product
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
        if (!scrapedProduct) return currentProduct;

        // ✅ NORMALIZE ONCE (THIS IS THE FIX)
        const normalizedScrapedProduct = {
          ...scrapedProduct,
          title: scrapedProduct.title ?? "",
          image: scrapedProduct.image ?? "",
          currency: scrapedProduct.currency ?? "₹",
          category: scrapedProduct.category ?? "",
          currentPrice: scrapedProduct.currentPrice ?? 0,
          originalPrice: scrapedProduct.originalPrice ?? 0,
          discountRate: scrapedProduct.discountRate ?? 0,
          stars: scrapedProduct.stars ?? 0,
        };

        // Update price history
        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          {
            price: normalizedScrapedProduct.currentPrice,
            date: new Date(),
          },
        ];

        // Build final product object
        const productData = {
          ...normalizedScrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };

        // Update DB
        const updatedProduct = await Product.findOneAndUpdate(
          { url: productData.url },
          productData,
          { new: true }
        );

        // ❗ THIS LINE WAS THE BUG (NOW FIXED)
        const emailNotifType = getEmailNotifType(
          normalizedScrapedProduct,
          currentProduct
        );

        // Send email if required
        if (emailNotifType && updatedProduct?.users?.length > 0) {
          const emailContent = await generateEmailBody(
            {
              title: updatedProduct.title,
              url: updatedProduct.url,
            },
            emailNotifType
          );

          const userEmails = updatedProduct.users.map(
            (user: any) => user.email
          );

          await sendEmail(emailContent, userEmails);
        }

        return updatedProduct;
      })
    );

    return NextResponse.json({
      message: "Cron job executed successfully",
      data: updatedProducts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
