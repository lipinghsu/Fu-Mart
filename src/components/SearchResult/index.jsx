import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import Header from '../Header';
import Footer from '../Footer';
import ProductCard from '../ProductCard';
import ProductModal from '../Storefront/ProductModal';
import { useTranslation } from 'react-i18next';
import sortIcon from '../../assets/Icons/arrowIcon.png';
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
  
  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState(1);

  const resultsTopRef = useRef(null);

  // page-number generator with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxShown = 5; // current ± 2
    if (totalPages <= maxShown) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    if (start > 1) pages.push(1, '…');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages) pages.push('…', totalPages);
    return pages;
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setCurrentPage(p);
    // Smooth scroll back up to the top of results for better UX
    const grid = document.querySelector('.product-grid');
    (grid || window).scrollTo({ top: 0, behavior: 'smooth' });
  };
  
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
    setCurrentPage(1);
  }, [searchQuery, sortOption, selectedCategory, selectedSubCategory, filteredResults.length]);

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
    const matched = query === "viewall" ? products : products.filter(p =>
      (p.name?.toLowerCase().includes(query) || p.subtitle?.toLowerCase().includes(query))
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

  const sortedFiltered = useMemo(() => {
    return filteredResults
      .filter(product =>
        (selectedCategory === allCategoryLabel || product.category === selectedCategory) &&
        (!selectedSubCategory || product.subCategory === selectedSubCategory)
      )
      .sort((a, b) => {
        if (sortOption === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
        if (sortOption === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
        if (sortOption === 'name-asc') return (a.name ?? '').localeCompare(b.name ?? '');
        if (sortOption === 'name-desc') return (b.name ?? '').localeCompare(a.name ?? '');
        if (sortOption === 'new-arrivals') {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return (dateB?.getTime?.() ?? 0) - (dateA?.getTime?.() ?? 0);
        }
        return 0;
      });
  }, [filteredResults, selectedCategory, selectedSubCategory, sortOption, allCategoryLabel]);

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedFiltered.slice(start, start + PAGE_SIZE);
  }, [sortedFiltered, currentPage]);

  const startIdx = sortedFiltered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endIdx   = Math.min(currentPage * PAGE_SIZE, sortedFiltered.length);

  
  // Scroll the anchor into view when page changes
  useEffect(() => {
    if (!loading) {
      resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Fallback for older browsers
      if (!resultsTopRef.current) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, loading]);

  return (
    <div className="search-result-page">
      <Header hasSearchBar={true} mainPageHeader={true}/>
      <div ref={resultsTopRef} className="results-top-anchor" aria-hidden="true" />

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
      <div className={`search-summary ${sortedFiltered.length === 0 ? 'center' : 'left'}`}>
      <h2>
        {searchQuery?.toLowerCase() !== "viewall" ? (
          sortedFiltered.length > 1 
            ? t('searchResultsFor_plural', {
                length: sortedFiltered.length,
                searchQuery
              })
            : sortedFiltered.length === 0
              ? t('nothingMatched', {
                  length: sortedFiltered.length,
                  searchQuery
                })
              : t('searchResultsFor', {
                  length: sortedFiltered.length,
                  searchQuery
                })
        ) : (
          // Fallback if it's NOT "viewall"
          t('allCountProducts', { length: sortedFiltered.length })
        )}
      </h2>
              
      {!loading && sortedFiltered.length === 0 && (
        <div className="no-results-wrap">
          <div className="no-results-message">
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results solid">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results subtitle">{t('tryAnotherSearch')}</div>
          </div>
        </div>
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
          : pagedProducts.map((product) => (   // <-- use pagedProducts here
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                t={t}
              />
            ))}
      </div>

      {!loading && sortedFiltered.length > PAGE_SIZE && (
        <nav className="pagination" aria-label="Product pagination">

          <button
            className="page-nav"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            {t('common:prev') || 'Prev'}
          </button> 

          <div className="page-list" role="list">
            {getPageNumbers().map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`page-num ${currentPage === p ? 'active' : ''}`}
                  onClick={() => goToPage(p)}
                  aria-current={currentPage === p ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            className="page-nav"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            {t('common:next') || 'Next'}
          </button>

          {/* <div className="pagination-summary" role="status" aria-live="polite">
            {t('common:showingRange', {
              start: startIdx,
              end: endIdx,
              total: sortedFiltered.length,
              defaultValue: 'displaying {{start}} – {{end}} of {{total}} results',
            })}
          </div> */}
        </nav>
      )}

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
