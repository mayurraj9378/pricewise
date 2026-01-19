import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { connectDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";

interface PageProps {
  params: {
    id: string;
  };
}

async function getProductById(id: string) {
  await connectDB();
  return Product.findById(id);
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = params;

  // 1️⃣ Fetch product
  const product = await getProductById(id);

  // 2️⃣ Handle null (FIX 1)
  if (!product) {
    notFound();
  }

  // 3️⃣ Convert Mongoose document → plain JS object (FIX 3)
  const plainProduct = JSON.parse(JSON.stringify(product));

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductCard
        key={plainProduct._id.toString()} // FIX 2
        product={plainProduct}
      />
    </div>
  );
}
