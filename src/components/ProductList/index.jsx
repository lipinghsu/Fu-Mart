import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import Header from '../Header';
import Footer from '../Footer';
import ProductCard from '../ProductCard'; 
import ProductModal from './ProductModal';
import { useTranslation } from 'react-i18next';
import sortIcon from '../../assets/sortIcon.png'
import fumartLogo from '../../assets/fumart-m-red-bg.png'
import './ProductList.scss';

const ProductList = () => {
  const { t, ready } = useTranslation(['storefront', 'common']);
  const dropdownRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    return savedTheme === 'dark';
  });

  const [sortOption, setSortOption] = useState('default');
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const allCategoryLabel = ready ? t('allCategory') : 'All';


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // disable scrolling if modal is active
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

  const handleSortSelect = (value) => {
    setSortOption(value);
    setDropdownOpen(false);
  };
  
  const getSortLabel = (option, t) => {
    switch (option) {
      case 'new-arrivals': return t('newArrivals');
      case 'price-asc': return t('lowHigh');
      case 'price-desc': return t('highLow');
      case 'name-asc': return t('aToZ');
      case 'name-desc': return t('zToA');
      default: return t('bestMatch');
    }
  };

  
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
      if (sortOption === 'new-arrivals') {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA; // newest first
      }
      return 0;
    })

  return (
    <div className="product-list">
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
            <div className='logo-btn'>
              <img src={fumartLogo}/>
            </div>
          </div>
        </div>
      </div>
      <div className="category-sort-wrapper">
        <div className="category-tabs">
          {categories.map((category) => (
            <div className="category-tab-wrapper" key={category}>
              <button
                className={`category-tab ${
                  selectedCategory === category ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            </div>
          ))}
        </div>

        <div className="sort-control" ref={dropdownRef}>
        <div className="sort-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <span className="sort-label">{getSortLabel(sortOption, t)}</span>
          <span className="sort-icon-container">
            <img src={sortIcon} />
          </span>
        </div>
          
          <div className={`sort-dropdown ${dropdownOpen ? 'open' : ''}`}>
            <div  className="option block"/>
            <div className="option" onClick={() => handleSortSelect('default')}>
              {t('bestMatch')}
            </div>
            <div className="option" onClick={() => handleSortSelect('new-arrivals')}>
              {t('newArrivals')}
            </div>
            <div className="option" onClick={() => handleSortSelect('price-asc')}>
              {t('lowHigh')}
            </div>
            <div className="option" onClick={() => handleSortSelect('price-desc')}>
              {t('highLow')}
            </div>
          </div>
        </div>
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
              <ProductCard
                key={product.id}
                product={product}
                onClick={setSelectedProduct}
                isDarkMode={isDarkMode}
                t={t}
              />
            ))}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(product, qty) => console.log('Add to cart:', product, qty)}
          onBuyNow={(product, qty) => console.log('Buy now:', product, qty)}
          onSelectSuggested={(product) => setSelectedProduct(product)} // 👈 ADD THIS
          isDarkMode={isDarkMode}
        />
      )}

      <Footer isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  );
};

export default ProductList;
