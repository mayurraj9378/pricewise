import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true },
    currency: String,
    image: String,
    title: String,

    currentPrice: Number,
    originalPrice: Number,

    priceHistory: [
      {
        price: Number,
        date: { type: Date, default: Date.now },
      },
    ],

    lowestPrice: Number,
    highestPrice: Number,
    averagePrice: Number,

    description: String,
    isOutOfStock: Boolean,

    users: [{ email: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model('Product', productSchema);
