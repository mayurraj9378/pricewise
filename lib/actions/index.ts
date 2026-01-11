'use server';

import { connectDB } from '../mongoose';
import Product from '../models/product.model';

// =====================
// TRENDING PRODUCTS
// =====================
export async function getAllProducts() {
  try {
    await connectDB();

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    return products;
  } catch (error) {
    console.error('getAllProducts error:', error);
    return [];
  }
}

// =====================
// PRODUCT DETAILS
// =====================
export async function getProductById(id: string) {
  try {
    await connectDB();

    const product = await Product.findById(id).lean();

    return product;
  } catch (error) {
    console.error('getProductById error:', error);
    return null;
  }
}

// =====================
// SIMILAR PRODUCTS
// =====================
export async function getSimilarProducts(id: string) {
  try {
    await connectDB();

    const products = await Product.find({ _id: { $ne: id } })
      .limit(3)
      .lean();

    return products;
  } catch (error) {
    console.error('getSimilarProducts error:', error);
    return [];
  }
}

// =====================
// EMAIL SUBSCRIBE
// =====================
export async function addUserEmailToProduct(
  productId: string,
  email: string
) {
  try {
    await connectDB();

    await Product.findByIdAndUpdate(productId, {
      $addToSet: { users: { email } },
    });

    return true;
  } catch (error) {
    console.error('addUserEmailToProduct error:', error);
    return false;
  }
}
