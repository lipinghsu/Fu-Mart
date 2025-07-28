import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/utils';
import ProductCard from './../../ProductCard';
import ProductModal from './../../Storefront/ProductModal';
import './LatestProducts.scss';
import { useTranslation } from 'react-i18next';

const LatestProducts = ({ onSelectProduct }) => {
  const { t } = useTranslation(['home']);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const latestListRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const latestVisibleProducts = latestProducts.filter((product) => !product.hidden);

  useEffect(() => {
    if (selectedProduct) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct]);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const q = query(
          collection(firestore, 'products'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const products = [];
        snapshot.forEach((doc) => products.push({ id: doc.id, ...doc.data() }));
        setLatestProducts(products);
      } catch (err) {
        console.error('Error fetching latest products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestProducts();
  }, []);

  return (
    <div className="latest-products styled-latest-products">
      <div className="latest-products-title">
        <div>{t('latestProducts')}</div>
      </div>
      <div
        className="latest-product-list horizontal-scroll"
        ref={latestListRef}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div className="latest-product-item" key={idx}>
                <div className="product-card-skeleton">
                  <div className="skeleton-image" />
                  <div className="skeleton-text title" />
                  <div className="skeleton-text sub-title" />
                  <div className="skeleton-text price" />
                </div>
              </div>
            ))
          : latestVisibleProducts.map((item) => (
              <div className="latest-product-item" key={item.id}>
                <ProductCard
                  product={item}
                  onClick={() => setSelectedProduct(item)}
                  t={t}
                />
              </div>
            ))}
      </div>
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p, q) => console.log('Add to cart:', p, q)}
          onBuyNow={(p, q) => console.log('Buy now:', p, q)}
          onSelectSuggested={(p) => setSelectedProduct(p)}
          isDarkMode={localStorage.getItem('preferredTheme') === 'dark'}
          allProducts={latestVisibleProducts}
          setSelectedProduct={setSelectedProduct}
        />
      )}
    </div>
  );
};

export default LatestProducts;
