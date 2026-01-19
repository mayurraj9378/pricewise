import { PriceHistoryItem, Product } from "@/types";

const Notification = {
  WELCOME: "WELCOME",
  CHANGE_OF_STOCK: "CHANGE_OF_STOCK",
  LOWEST_PRICE: "LOWEST_PRICE",
  THRESHOLD_MET: "THRESHOLD_MET",
};

const THRESHOLD_PERCENTAGE = 40;

export function extractPrice(...elements: any) {
  for (const element of elements) {
    const priceText = element.text().trim();
    if (priceText) {
      const cleanPrice = priceText.replace(/[^\d.]/g, "");
      const firstPrice = cleanPrice.match(/\d+\.\d{2}/)?.[0];
      return firstPrice || cleanPrice;
    }
  }
  return "";
}

export function extractCurrency(element: any) {
  const currencyText = element.text().trim().slice(0, 1);
  return currencyText || "";
}

export function extractDescription($: any) {
  const selectors = [
    ".a-unordered-list .a-list-item",
    ".a-expander-content p",
  ];

  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      return elements
        .map((_: any, el: any) => $(el).text().trim())
        .get()
        .join("\n");
    }
  }
  return "";
}

export function getHighestPrice(priceList: PriceHistoryItem[]) {
  return Math.max(...priceList.map((p) => p.price));
}

export function getLowestPrice(priceList: PriceHistoryItem[]) {
  return Math.min(...priceList.map((p) => p.price));
}

export function getAveragePrice(priceList: PriceHistoryItem[]) {
  if (!priceList.length) return 0;
  const sum = priceList.reduce((acc, curr) => acc + curr.price, 0);
  return sum / priceList.length;
}

/**
 * ✅ FINAL FIX:
 * scrapedProduct is NOT a full Product
 */
export const getEmailNotifType = (
  scrapedProduct: Partial<Product>,
  currentProduct: Product
) => {
  const lowestPrice = getLowestPrice(currentProduct.priceHistory);

  if (
    typeof scrapedProduct.currentPrice === "number" &&
    scrapedProduct.currentPrice < lowestPrice
  ) {
    return Notification.LOWEST_PRICE as keyof typeof Notification;
  }

  if (
    scrapedProduct.isOutOfStock === false &&
    currentProduct.isOutOfStock === true
  ) {
    return Notification.CHANGE_OF_STOCK as keyof typeof Notification;
  }

  if (
    typeof scrapedProduct.discountRate === "number" &&
    scrapedProduct.discountRate >= THRESHOLD_PERCENTAGE
  ) {
    return Notification.THRESHOLD_MET as keyof typeof Notification;
  }

  return null;
};

export const formatNumber = (num: number = 0) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
