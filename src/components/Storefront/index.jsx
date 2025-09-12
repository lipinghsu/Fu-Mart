import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import Header from '../Header';
import Footer from '../Footer';
import ProductCard from '../ProductCard';
import ProductModal from './ProductModal';
import BrowseTitle from './BrowseTitle';
import './Storefront.scss';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Storefront = () => {
  const { t, ready } = useTranslation(['storefront', 'common']);
  const navigate = useNavigate();
  const [productsByGroup, setProductsByGroup] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [filterBy, setFilterBy] = useState('category'); // 'category' | 'origin' | 'brand'

  useEffect(() => {
    if (!ready) return;

    const fetchAndGroupProducts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(firestore, 'products'));
        const products = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => !p.hidden);

        // Group by the chosen key
        const grouped = {};
        products.forEach(product => {
          // If filterBy === 'brand', use product.brand; otherwise existing logic
          const rawKey = product[filterBy]; // NEW
          const safeKey =
            (typeof rawKey === 'string' && rawKey.trim()) ||
            (filterBy === 'brand' ? 'Unknown Brand' : t('uncategorized'));

          if (!grouped[safeKey]) grouped[safeKey] = [];
          grouped[safeKey].push(product);
        });

        // Shuffle and sort within each group
        const shuffledAndSorted = {};
        for (const [group, items] of Object.entries(grouped)) {
          const shuffled = [...items].sort(() => Math.random() - 0.5);
          shuffledAndSorted[group] = shuffled
            .slice(0, 8)
            .sort((a, b) => a.name.localeCompare(b.name));
        }

        setProductsByGroup(shuffledAndSorted);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupProducts();
  }, [ready, filterBy, t]);

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  // Navigate to the “View All” page with the active filter key
  const handleViewAll = (groupKey) => {
    // Works for category/origin/brand uniformly
    navigate(`/product?${filterBy}=${encodeURIComponent(groupKey)}`);
  };

  // Helper so we don’t translate brand names (but still translate categories/origins)
  const renderGroupLabel = (key) => {
    if (filterBy === 'brand') return key;
    return t(key);
  };

  return (
    <div className="product-list">
      <Header mainPageHeader hasSearchBar />
      <BrowseTitle filterBy={filterBy} setFilterBy={setFilterBy} /> 

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
        Object.entries(productsByGroup).sort(([a], [b]) => a.localeCompare(b)).map(([groupKey, items]) => (
          <div className="latest-products styled-latest-products" key={`${filterBy}-${groupKey}`}>
            <div className="latest-products-title">
              <div>{renderGroupLabel(groupKey)}</div>
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
                onClick={() => handleViewAll(groupKey)}
              >
                <div className="view-all-content">
                  {/* Keep copy generic—works for brand, too */}
                  <span>{t('exploreCategoryAisle')}</span>
                  <br />
                  <span>{renderGroupLabel(groupKey)}</span>
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
          allProducts={Object.values(productsByGroup).flat()}
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
