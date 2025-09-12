import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/utils';
import ProductCard from './../../ProductCard';
import ProductModal from './../../Storefront/ProductModal';
import './RecommendedProducts.scss'; // reused styling
import { useTranslation } from 'react-i18next';

const RecommendedProducts = () => {
  const { t } = useTranslation(['home']);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const listRef = useRef(null);

  // const visibleProducts = recommendedProducts.filter(product => !product.hidden);
  const visibleProducts = recommendedProducts;

  useEffect(() => {
    if (selectedProduct) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const q = query(collection(firestore, 'products'), where('recommended', '>', 0));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort by recommended score ascending
        const sorted = products.sort((a, b) => a.recommended - b.recommended);
        setRecommendedProducts(sorted);
      } catch (err) {
        console.error('Error fetching recommended products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, []);

  return (
    <div className="rec-products styled-latest-products">
      <div className="rec-products-title">
        <div>{t('recommendedProducts') || 'Recommended for You'}</div>
      </div>
      <div className="rec-product-list horizontal-scroll" ref={listRef}>
        {loading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div className="rec-product-item" key={idx}>
                <div className="product-card-skeleton">
                  <div className="skeleton-image" />
                  <div className="skeleton-text title" />
                  <div className="skeleton-text sub-title" />
                  <div className="skeleton-text price" />
                </div>
              </div>
            ))
          : visibleProducts.map(product => (
              <div className="rec-product-item" key={product.id}>
                <ProductCard
                  product={product}
                  onClick={() => setSelectedProduct(product)}
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
          onSelectSuggested={p => setSelectedProduct(p)}
          isDarkMode={localStorage.getItem('preferredTheme') === 'dark'}
          allProducts={visibleProducts}
          setSelectedProduct={setSelectedProduct}
        />
      )}
    </div>
  );
};

export default RecommendedProducts;
