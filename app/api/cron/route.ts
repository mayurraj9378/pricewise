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
  // ⛔ Skip cron during build
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

        const priceHistory = currentProduct.priceHistory.concat({
          price: scraped.currentPrice ?? 0,
          date: new Date(),
        });

        const updatedProduct = await Product.findOneAndUpdate(
          { url: scraped.url },
          {
            ...scraped,
            priceHistory,
            lowestPrice: getLowestPrice(priceHistory),
            highestPrice: getHighestPrice(priceHistory),
            averagePrice: getAveragePrice(priceHistory),
          },
          { new: true }
        );

        // ✅ THIS IS NOW TYPE-SAFE
        const emailNotifType = getEmailNotifType(
          scraped,
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
