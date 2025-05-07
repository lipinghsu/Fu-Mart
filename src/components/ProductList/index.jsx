import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import Header from '../Header';
import Footer from '../Footer';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import './ProductList.scss';

const ProductList = () => {
  const { t, ready } = useTranslation(['storefront', 'common']);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    return savedTheme === 'dark';
  });

  const [sortOption, setSortOption] = useState('default');
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Provide fallback if translation system isn’t ready yet
  const allCategoryLabel = ready ? t('allCategory') : 'All';

  useEffect(() => {
    if (!selectedCategory && ready) {
      setSelectedCategory(allCategoryLabel);
    }
  }, [ready, allCategoryLabel, selectedCategory]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark-mode', newMode);
    localStorage.setItem('preferredTheme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'products'));
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(items);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [allCategoryLabel, ...new Set(products.map((p) => p.category))];

  const filteredProducts = products
    .filter((product) =>
      (product.name.toLowerCase().includes(filterText.toLowerCase()) ||
      product.subtitle.toLowerCase().includes(filterText.toLowerCase())) &&
      (selectedCategory === allCategoryLabel || product.category === selectedCategory)
    )
    .sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

  return (
    <div className="product-list">
      {/* //<Header title={t('title')} homepageHeader={true} /> */}
      <Header title={"FÜ-MART"} homepageHeader={true} /> 

      <div className="filter-sort-header">
        <div className="controls">
          <div className="filter-input">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <div className="sort-dropdown">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">{t('sortBy')}</option>
              <option value="price-asc">{t('lowHigh')}</option>
              <option value="price-desc">{t('highLow')}</option>
              <option value="name-asc">{t('aToZ')}</option>
              <option value="name-desc">{t('zToA')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="category-tabs">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-tab ${
              selectedCategory === category ? 'active' : ''
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="product-card skeleton">
                <div className="product-image-wrap">
                  <div className="skeleton-image"></div>
                </div>
                <div className="product-info">
                  <div className="skeleton-text name"></div>
                  <div className="skeleton-text subtitle"></div>
                  <div className="skeleton-text price"></div>
                </div>
              </div>
            ))
          : filteredProducts.map((product) => (
              <div key={product.id} className="product-card loaded">
                {product.images && product.images[0] && (
                  <div className="product-image-wrap">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="product-image"
                    />
                  </div>
                )}
                <div className="product-info">
                  <div className='product-name'>{product.name}</div>
                  <p className="subtitle">{product.subtitle}</p>
                  <p className="price">
                    <span>${product.price.toFixed(2)}</span>
                  </p>
                </div>
                <button className="add-to-cart-btn">
                  <span className="text-default">{t('add')}</span>
                  <span className="text-hover">{t('addToCart')}</span>
                </button>
              </div>
            ))}
      </div>

      <Footer isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  );
};

export default ProductList;
