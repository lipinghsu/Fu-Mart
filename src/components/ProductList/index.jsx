import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import Header from '../Header';
import Footer from '../Footer';
import ProductCard from '../ProductCard'; 
import ProductModal from './ProductModal';
import { useTranslation } from 'react-i18next';
import sortIcon from '../../assets/arrowIcon.png';
import fumartLogo from '../../assets/fumart-m-red-bg.png';
import './ProductList.scss';

const ProductList = () => {
  const { t, ready } = useTranslation(['storefront', 'common']);
  const dropdownRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('new-arrivals');
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subcategoriesMap, setSubcategoriesMap] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [isHoveringCategoryArea, setIsHoveringCategoryArea] = useState(false);
  const allCategoryLabel = ready ? t('allCategory') : 'All';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (!selectedCategory && ready) {
      setSelectedCategory(allCategoryLabel);
    }
  }, [ready, allCategoryLabel, selectedCategory]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', localStorage.getItem('preferredTheme') === 'dark');
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'products'));
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(items);

        // Create category map: [category => Set of subcategories]
        const categoryMap = new Map();

        for (const item of items) {
          const category = item.category;
          const subCategory = item.subCategory;

          if (!category || !subCategory) continue;

          if (!categoryMap.has(category)) {
            categoryMap.set(category, new Set());
          }
          categoryMap.get(category).add(subCategory);
        }

        // Convert Map to plain object for React state
        const plainObject = {};
        for (const [key, valueSet] of categoryMap.entries()) {
          plainObject[key] = Array.from(valueSet);
        }

        console.log('Subcategories Map:', plainObject); // Debug output
        setSubcategoriesMap(plainObject);


      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    // create a category map, [key:category, value: set of subcategories]
    // category and subCategory is a field in the document
    fetchProducts();
  }, []);

  const toggleDarkMode = () => {
    const newMode = localStorage.getItem('preferredTheme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('preferredTheme', newMode);
    document.documentElement.classList.toggle('dark-mode', newMode === 'dark');
  };

  const handleSortSelect = (value) => {
    setSortOption(value);
    setDropdownOpen(false);
  };

  useEffect(() => {
  if (selectedCategory === allCategoryLabel) {
    setSelectedSubCategory('');
  }
}, [selectedCategory]);

  const getSortLabel = (option) => {
    switch (option) {
      case 'new-arrivals': return t('newArrivals');
      case 'price-asc': return t('lowHigh');
      case 'price-desc': return t('highLow');
      case 'name-asc': return t('aToZ');
      case 'name-desc': return t('zToA');
      default: return t('newArrivals');
    }
  };

  const categories = [allCategoryLabel, ...new Set(products.map((p) => p.category))];

  const filteredProducts = products
    .filter((product) =>
      (product.name.toLowerCase().includes(filterText.toLowerCase()) ||
      product.subtitle.toLowerCase().includes(filterText.toLowerCase())) &&
      (selectedCategory === allCategoryLabel || product.category === selectedCategory) &&
      (!selectedSubCategory || product.subCategory === selectedSubCategory)
    )
    .sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
      if (sortOption === 'new-arrivals') {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      }
      return 0;
    });

  return (
    <div className="product-list">
      <Header 
        homepageHeader={true}
        hasSearchBar={true} 
      />
      {/* <div className="filter-sort-header">
        <div className="controls">
          <div className="filter-input">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <div className='logo-btn'>
              <img src={fumartLogo} />
            </div>
          </div>
        </div>
      </div> */}

      <div
        className="category-sort-wrapper"
        onMouseEnter={() => setIsHoveringCategoryArea(true)}
        onMouseLeave={() => {
          setIsHoveringCategoryArea(false);
          setHoveredCategory(null);
        }}
      >
<div className="category-tabs">
  {categories.map((category) => (
    <div
      className="category-tab-wrapper"
      key={category}
      onMouseEnter={() => setHoveredCategory(category)}
    >
      <button
        className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
        onClick={() => {
          setSelectedCategory(category);
          setSelectedSubCategory('');
        }}
        onMouseEnter={() => setHoveredCategory(category)}
      >
        <span>
          {t(category)}
        </span>
        
      </button>

      {hoveredCategory === category &&
        subcategoriesMap[category]?.length > 0 &&
        isHoveringCategoryArea && (
          <div className="subcategory-dropdown">
            {subcategoriesMap[category]
            .sort((a, b) => a.localeCompare(b))
            .map((sub) => (
            <div
              className="subcategory-item"
              key={sub}
              onClick={() => {
                setSelectedSubCategory(sub);
                setSelectedCategory(category);
                setHoveredCategory(null);              
                setIsHoveringCategoryArea(false);      
              }}
            >
              {t(sub)}
            </div>
            ))}
          </div>
      )}
    </div>
  ))}
</div>



        <div className="sort-control" ref={dropdownRef}>
          <div className="sort-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span className="sort-label">{getSortLabel(sortOption)}</span>
            <span className={`sort-icon-container ${dropdownOpen ? 'open' : ''}`}>
              <img src={sortIcon} />
            </span>
          </div>
          <div className={`sort-dropdown ${dropdownOpen ? 'open' : ''}`}>
            <div className="option block" />
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
              onClick={(e, type) => {
                setSelectedProduct(product);
              }}
              isDarkMode={localStorage.getItem('preferredTheme') === 'dark'}
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
          onSelectSuggested={(product) => setSelectedProduct(product)}
          isDarkMode={localStorage.getItem('preferredTheme') === 'dark'}
        />
      )}

      <Footer isDarkMode={localStorage.getItem('preferredTheme') === 'dark'} toggleDarkMode={toggleDarkMode} />
    </div>
  );
};

export default ProductList;
