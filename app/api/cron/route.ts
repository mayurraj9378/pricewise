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

export async function GET(request: Request) {
  try {
    // 1️⃣ Connect to DB
    await connectDB();

    // 2️⃣ Fetch all products
    const products = await Product.find({});

    if (!products.length) {
      return NextResponse.json(
        { message: "No products found" },
        { status: 200 }
      );
    }

    // 3️⃣ Update products
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        try {
          // Scrape latest product data
          const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

          if (!scrapedProduct) return currentProduct;

          // Update price history
          const updatedPriceHistory = [
            ...currentProduct.priceHistory,
            {
              price: scrapedProduct.currentPrice ?? 0,
              date: new Date(),
            },
          ];

          // Calculate price metrics
          const lowestPrice = getLowestPrice(updatedPriceHistory) ?? 0;
          const highestPrice = getHighestPrice(updatedPriceHistory) ?? 0;
          const averagePrice = getAveragePrice(updatedPriceHistory) ?? 0;

          // ✅ Prepare DB update payload - matches scraper return type
          const productData = {
            url: scrapedProduct.url,
            title: scrapedProduct.title ?? "",
            image: scrapedProduct.image ?? "",
            currency: scrapedProduct.currency ?? "₹",
            category: scrapedProduct.category ?? "",
            description: scrapedProduct.description ?? "",
            currentPrice: scrapedProduct.currentPrice ?? 0,
            originalPrice: scrapedProduct.originalPrice ?? 0,
            discountRate: scrapedProduct.discountRate ?? 0,
            stars: 0,
            reviewsCount: scrapedProduct.reviewsCount ?? 0,
            isOutOfStock: scrapedProduct.isOutOfStock ?? false,
            priceHistory: updatedPriceHistory,
            lowestPrice: lowestPrice,
            highestPrice: highestPrice,
            averagePrice: averagePrice,
          };

          // Update product in DB
          const updatedProduct = await Product.findOneAndUpdate(
            { url: productData.url },
            productData,
            { new: true }
          );

          // Check email notification type
          const emailNotifType = getEmailNotifType(
            scrapedProduct,
            currentProduct
          );

          // Send email if required
          if (emailNotifType && updatedProduct?.users?.length > 0) {
            const productInfo = {
              title: updatedProduct.title,
              url: updatedProduct.url,
            };

            const emailContent = await generateEmailBody(
              productInfo,
              emailNotifType
            );

            const userEmails = updatedProduct.users.map(
              (user: any) => user.email
            );

            await sendEmail(emailContent, userEmails);
          }

          return updatedProduct;
        } catch (error) {
          console.error(`Error updating product ${currentProduct.url}:`, error);
          return currentProduct;
        }
      })
    );

    // 4️⃣ Response
    return NextResponse.json({
      message: "Products updated successfully",
      data: updatedProducts,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: `Failed to update products: ${error.message}` },
      { status: 500 }
    );
  }
}