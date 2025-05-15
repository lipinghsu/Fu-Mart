import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/utils';
import ProductCard from './../../ProductCard';
import ProductModal from './../../ProductList/ProductModal';
import './LatestProducts.scss';
import { useTranslation } from 'react-i18next';

const LatestProducts = ({ onSelectProduct }) => {
  const { t } = useTranslation(['home']);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const suggestionsRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const q = query(
          collection(firestore, 'products'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const products = [];
        querySnapshot.forEach((doc) => {
          products.push({ id: doc.id, ...doc.data() });
        });
        setLatestProducts(products);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching latest products:', error);
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  return (
    <div className="latest-products styled-suggestions">
      <div className="suggestion-title">
        <h2>{t('latestProducts')}</h2>
      </div>
      <div className="suggested-items horizontal-scroll" ref={suggestionsRef}>
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <div className="suggested-item" key={index}>
                <div className="product-card-skeleton" />
              </div>
            ))
          : latestProducts.length > 0
          ? latestProducts.map((item) => (
              <div className="suggested-item" key={item.id}>
                <ProductCard
                  product={item}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    onSelectProduct?.(item);
                  }}
                  t={t}
                />
              </div>
            ))
          : null}
      </div>
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default LatestProducts;
