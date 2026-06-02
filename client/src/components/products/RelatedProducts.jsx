import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import ProductCard from './ProductCard';
import { productApi } from '../../api/productApi';

export default function RelatedProducts({ productId, onQuickView }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let active = true;
    productApi
      .related(productId)
      .then((res) => active && setProducts(res.data.products || []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-6 font-serif text-2xl text-textPrimary md:text-3xl">You may also like</h2>
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={20}
        slidesPerView={1.2}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 4 },
        }}
      >
        {products.map((p) => (
          <SwiperSlide key={p._id} className="h-auto pb-2">
            <ProductCard product={p} onQuickView={onQuickView} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
