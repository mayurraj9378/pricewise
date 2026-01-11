import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const imageSrc =
    product.image && product.image.startsWith('http')
      ? product.image
      : '/assets/images/placeholder.png';

  return (
    <Link href={`/products/${product._id}`} className="product-card">
      <div className="product-card_img-container">
        <Image
          src={imageSrc}
          alt={product.title || 'Product image'}
          width={200}
          height={200}
          className="product-card_img"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="product-title">
          {product.title || 'No title available'}
        </h3>

        <p className="text-black opacity-50">Product</p>

        <p className="text-black text-lg font-semibold">
          ₹{product.currentPrice ?? '--'}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
