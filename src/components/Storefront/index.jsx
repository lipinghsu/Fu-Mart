import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import Header from '../Header';
import Footer from '../Footer';
import ProductCard from '../ProductCard';
import ProductModal from './ProductModal';
import './Storefront.scss';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Storefront = () => {
  const { t, ready } = useTranslation(['storefront', 'common']);
  const navigate = useNavigate();
  const [productsByCategory, setProductsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (!ready) return;

    const fetchAndGroupProducts = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'products'));
        const products = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => !p.hidden);

        // Group by category
        const grouped = {};
        products.forEach(product => {
          const category = product.category || t('uncategorized');
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(product);
        });

        // Shuffle and sort within each category
        const shuffledAndSorted = {};
        for (const [category, items] of Object.entries(grouped)) {
          const shuffled = [...items].sort(() => Math.random() - 0.5);
          shuffledAndSorted[category] = shuffled
            .slice(0, 8)
            .sort((a, b) => a.name.localeCompare(b.name));
        }

        setProductsByCategory(shuffledAndSorted);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupProducts();
  }, [ready]);

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  const handleViewAll = (category) => {
    navigate(`/product?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="product-list">
      <Header mainPageHeader hasSearchBar />

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="product-card skeleton">
              <div className="product-image-wrap"><div className="skeleton-image" /></div>
              <div className="product-info">
                <div className="skeleton-text name" />
                <div className="skeleton-text subtitle" />
                <div className="skeleton-text price" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(productsByCategory).map(([category, items]) => (
          <div className="latest-products styled-latest-products" key={category}>
            <div className="latest-products-title">
              <div>{t(category)}</div>
            </div>
            <div className="latest-product-list horizontal-scroll">
              {items.map(product => (
                <div className="latest-product-item" key={product.id}>
                  <ProductCard
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                    t={t}
                  />
                </div>
              ))}
              <div
                className="latest-product-item view-all-card"
                onClick={() => handleViewAll(category)}
              >
                <div className="view-all-content">
                  <span>{t('exploreCategoryAisle')}</span>
                  <br/>
                  <span>{t(category)}</span>
                  <span>{t('aisle')}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(prod, qty) => console.log('Add to cart:', prod, qty)}
          onBuyNow={(prod, qty) => console.log('Buy now:', prod, qty)}
          onSelectSuggested={(p) => setSelectedProduct(p)}
          isDarkMode={localStorage.getItem('preferredTheme') === 'dark'}
          allProducts={Object.values(productsByCategory).flat()}
          setSelectedProduct={setSelectedProduct}
        />
      )}

      <Footer
        isDarkMode={localStorage.getItem('preferredTheme') === 'dark'}
        toggleDarkMode={() => {
          const newMode = localStorage.getItem('preferredTheme') === 'dark' ? 'light' : 'dark';
          localStorage.setItem('preferredTheme', newMode);
          document.documentElement.classList.toggle('dark-mode', newMode === 'dark');
        }}
      />
    </div>
  );
};

export default Storefront;
