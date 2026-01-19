import ProductCard from "@/components/ProductCard";
import { getAllProducts } from "@/lib/actions";

export default async function Home() {
  const allProducts = await getAllProducts();

  return (
    <section className="px-6 py-10">
      <h2 className="text-2xl font-semibold mb-8">All Products</h2>

      <div className="flex flex-wrap gap-x-8 gap-y-16">
        {allProducts?.map((product) => (
          <ProductCard
            key={product._id?.toString()} // ✅ FIXED
            product={product}
          />
        ))}
      </div>
    </section>
  );
}
