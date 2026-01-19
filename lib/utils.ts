import { PriceHistoryItem } from "@/types";

/* -------------------------------------------------------
   NOTIFICATION TYPES (STRICT & SAFE)
------------------------------------------------------- */

export const Notification = {
  WELCOME: "WELCOME",
  CHANGE_OF_STOCK: "CHANGE_OF_STOCK",
  LOWEST_PRICE: "LOWEST_PRICE",
  THRESHOLD_MET: "THRESHOLD_MET",
} as const;

export type NotificationType =
  (typeof Notification)[keyof typeof Notification];

const THRESHOLD_PERCENTAGE = 40;

/* -------------------------------------------------------
   HELPER TYPES (LOCAL, NOT DB MODEL)
------------------------------------------------------- */

export type PriceCheckProduct = {
  currentPrice: number;
  isOutOfStock: boolean;
  discountRate: number;
  priceHistory: PriceHistoryItem[];
};

/* -------------------------------------------------------
   PRICE HELPERS
------------------------------------------------------- */

export function getHighestPrice(priceList: PriceHistoryItem[]) {
  if (!priceList.length) return 0;

  let highest = priceList[0].price;
  for (const item of priceList) {
    if (item.price > highest) highest = item.price;
  }
  return highest;
}

export function getLowestPrice(priceList: PriceHistoryItem[]) {
  if (!priceList.length) return 0;

  let lowest = priceList[0].price;
  for (const item of priceList) {
    if (item.price < lowest) lowest = item.price;
  }
  return lowest;
}

export function getAveragePrice(priceList: PriceHistoryItem[]) {
  if (!priceList.length) return 0;

  const sum = priceList.reduce((acc, curr) => acc + curr.price, 0);
  return Math.round(sum / priceList.length);
}

/* -------------------------------------------------------
   EMAIL NOTIFICATION LOGIC (CORE FIX)
------------------------------------------------------- */

export const getEmailNotifType = (
  scraped: PriceCheckProduct,
  current: PriceCheckProduct
): NotificationType | null => {

  const lowestPrice = getLowestPrice(current.priceHistory);

  if (scraped.currentPrice < lowestPrice) {
    return Notification.LOWEST_PRICE;
  }

  if (!scraped.isOutOfStock && current.isOutOfStock) {
    return Notification.CHANGE_OF_STOCK;
  }

  if (scraped.discountRate >= THRESHOLD_PERCENTAGE) {
    return Notification.THRESHOLD_MET;
  }

  return null;
};

/* -------------------------------------------------------
   FORMATTERS
------------------------------------------------------- */

export const formatNumber = (num: number = 0) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
