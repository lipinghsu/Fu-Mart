// src/components/LatestProducts.jsx
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
      } catch (error) {
        console.error('Error fetching latest products:', error);
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
        {latestProducts.length > 0 ? (
          latestProducts.map((item) => (
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
        ) : (
          <p>{t('noProducts')}</p>
        )}
      </div>
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}

        />
      )}
    {/* {selectedProduct ? "1": "0"} */}
    </div>
  );
};

export default LatestProducts;
