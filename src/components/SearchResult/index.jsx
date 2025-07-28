import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import Header from '../Header';
import Footer from '../Footer';
import ProductCard from '../ProductCard';
import ProductModal from '../Storefront/ProductModal';
import { useTranslation } from 'react-i18next';
import sortIcon from '../../assets/arrowIcon.png';
import './SearchResult.scss';

const SearchResult = ({ searchQuery }) => {
  const { t } = useTranslation(['storefront', 'common']);
  const dropdownRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('new-arrivals');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subcategoriesMap, setSubcategoriesMap] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isHoveringCategoryArea, setIsHoveringCategoryArea] = useState(false);

  const allCategoryLabel = t('allCategory');

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
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'products'));
        const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(all);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery || !products.length) return;

    const query = searchQuery.toLowerCase();
    const matched = products.filter(p =>
      (p.name?.toLowerCase().includes(query) ||
        p.subtitle?.toLowerCase().includes(query))
    );
    setFilteredResults(matched);

    // Build subcategory map
    const categoryMap = new Map();
    for (const item of matched) {
      const category = item.category;
      const subCategory = item.subCategory;
      if (!category || !subCategory) continue;
      if (!categoryMap.has(category)) categoryMap.set(category, new Set());
      categoryMap.get(category).add(subCategory);
    }
    const plainMap = {};
    for (const [key, value] of categoryMap.entries()) {
      plainMap[key] = Array.from(value);
    }
    setSubcategoriesMap(plainMap);
  }, [searchQuery, products]);

useEffect(() => {
  // Only set if translation is loaded AND we have filtered results
  if (
    selectedCategory === '' &&
    allCategoryLabel &&
    filteredResults.length > 0
  ) {
    setSelectedCategory(allCategoryLabel);
  }
}, [selectedCategory, allCategoryLabel, filteredResults]);

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

  const categories = [allCategoryLabel, ...new Set(filteredResults.map(p => p.category))];

  const sortedFiltered = filteredResults
    .filter(product =>
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
    <div className="search-result-page">
      <Header hasSearchBar={true} 
       mainPageHeader={true}/>

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
                  setHoveredCategory(null);
                }}
              >
                <span>{t(category)}</span>
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
              <img src={sortIcon} alt="Sort" />
            </span>
          </div>
          <div className={`sort-dropdown ${dropdownOpen ? 'open' : ''}`}>
            <div className="option block" />
            <div className="option" onClick={() => {setSortOption('new-arrivals'); setDropdownOpen(false);}}>
              {t('newArrivals')}
            </div>
            <div className="option" onClick={() => {setSortOption('price-asc'); setDropdownOpen(false);}}>
              {t('lowHigh')}
            </div>
            <div className="option" onClick={() => {setSortOption('price-desc'); setDropdownOpen(false);}}>
              {t('highLow')}
            </div>
          </div>
        </div>
      </div>
      <div className="search-summary">
      <h2>
        {sortedFiltered.length > 1 ? 
        t('searchResultsFor_plural', {
          length: sortedFiltered.length,
          searchQuery
        }) : 
        t('searchResultsFor', {
          length: sortedFiltered.length,
          searchQuery
        })
      }
      </h2>
        
        {!loading && sortedFiltered.length === 0 && (
          <p>{t('noResultsFound')}</p>
        )}
      </div>

      <div className="product-grid">
        {loading
          ? Array.from({ length: 15 }).map((_, idx) => (
              <div key={idx} className="product-card skeleton">
                <div className="skeleton-image"></div>
                <div className="skeleton-text name"></div>
                <div className="skeleton-text subtitle"></div>
                <div className="skeleton-text price"></div>
              </div>
            ))
          : sortedFiltered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
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
          allProducts={sortedFiltered}
          setSelectedProduct={setSelectedProduct}
        />
      )}

      <Footer
        isDarkMode={localStorage.getItem('preferredTheme') === 'dark'}
        toggleDarkMode={() => {
          const newTheme = localStorage.getItem('preferredTheme') === 'dark' ? 'light' : 'dark';
          localStorage.setItem('preferredTheme', newTheme);
          document.documentElement.classList.toggle('dark-mode', newTheme === 'dark');
        }}
      />
    </div>
  );
};

export default SearchResult;
