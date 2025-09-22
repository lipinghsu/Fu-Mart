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

/* ------------------------------------------
 * Helpers
 * ----------------------------------------*/
const buildSubcategoryMap = (items) => {
  const map = new Map();
  for (const item of items) {
    const category = item.category;
    const sub = item.subCategory;
    if (!category || !sub) continue;
    if (!map.has(category)) map.set(category, new Set());
    map.get(category).add(sub);
  }
  const plain = {};
  for (const [k, set] of map.entries()) plain[k] = Array.from(set);
  return plain;
};

const getSortLabelKey = (option) => {
  switch (option) {
    case 'new-arrivals': return 'newArrivals';
    case 'price-asc':   return 'lowHigh';
    case 'price-desc':  return 'highLow';
    case 'name-asc':    return 'aToZ';
    case 'name-desc':   return 'zToA';
    default:            return 'newArrivals';
  }
};

const sortProducts = (arr, sortOption) => {
  return [...arr].sort((a, b) => {
    if (sortOption === 'price-asc')  return (a.price ?? 0) - (b.price ?? 0);
    if (sortOption === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
    if (sortOption === 'name-asc')   return (a.name ?? '').localeCompare(b.name ?? '');
    if (sortOption === 'name-desc')  return (b.name ?? '').localeCompare(a.name ?? '');
    if (sortOption === 'new-arrivals') {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return (dateB?.getTime?.() ?? 0) - (dateA?.getTime?.() ?? 0);
    }
    return 0;
  });
};

/* ------------------------------------------
 * Component
 * ----------------------------------------*/
const PAGE_SIZE = 60;

const SearchResult = ({ searchQuery }) => {
  const { t } = useTranslation(['storefront', 'common']);

  const sortHoverTimer = useRef(null);
  /* Refs */
  const dropdownRef = useRef(null);
  const resultsTopRef = useRef(null);
  const closeTimer = useRef(null);

  /* State: data */
  const [products, setProducts] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState({});

  /* State: UI selections */
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOption, setSortOption] = useState('new-arrivals');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);

  /* State: UI toggles */
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false); // sort dropdown
  const [barHover, setBarHover] = useState(false);         // whole bar hover domain

  /* State: pagination */
  const [currentPage, setCurrentPage] = useState(1);

  /* Derived labels */
  const allCategoryLabel = t('allCategory');
  const sortLabel = t(getSortLabelKey(sortOption));

  /* ------------------------------------------
   * Effects: data loading / outside clicks
   * ----------------------------------------*/
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
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ------------------------------------------
   * Effects: filtering / category defaults
   * ----------------------------------------*/
  useEffect(() => {
    if (!searchQuery || !products.length) return;

    const q = searchQuery.toLowerCase();
    const matched = q === 'viewall'
      ? products
      : products.filter(p =>
          (p.name?.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q))
        );

    setFilteredResults(matched);
    setSubcategoriesMap(buildSubcategoryMap(matched));
  }, [searchQuery, products]);

  // set default category to "All" once we have results and translation
  useEffect(() => {
    if (selectedCategory === '' && allCategoryLabel && filteredResults.length > 0) {
      setSelectedCategory(allCategoryLabel);
    }
  }, [selectedCategory, allCategoryLabel, filteredResults.length]);

  // reset subcategory when "All" is selected
  useEffect(() => {
    if (selectedCategory === allCategoryLabel) {
      setSelectedSubCategory('');
    }
  }, [selectedCategory, allCategoryLabel]);

  // reset to page 1 on key changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, selectedCategory, selectedSubCategory, filteredResults.length]);

  // smooth scroll to top on page change
  useEffect(() => {
    if (!loading) {
      resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!resultsTopRef.current) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, loading]);

  /* ------------------------------------------
   * Memoized derived data
   * ----------------------------------------*/
  const categories = useMemo(
    () => [allCategoryLabel, ...new Set(filteredResults.map(p => p.category))],
    [filteredResults, allCategoryLabel]
  );

  const sortedFiltered = useMemo(() => {
    const scoped = filteredResults.filter(product =>
      (selectedCategory === allCategoryLabel || product.category === selectedCategory) &&
      (!selectedSubCategory || product.subCategory === selectedSubCategory)
    );
    return sortProducts(scoped, sortOption);
  }, [filteredResults, selectedCategory, selectedSubCategory, sortOption, allCategoryLabel]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE)),
    [sortedFiltered.length]
  );

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedFiltered.slice(start, start + PAGE_SIZE);
  }, [sortedFiltered, currentPage]);

  const startIdx = sortedFiltered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endIdx   = Math.min(currentPage * PAGE_SIZE, sortedFiltered.length);

  const getPageNumbers = () => {
    const pages = [];
    const maxShown = 5;
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

  /* ------------------------------------------
   * Handlers
   * ----------------------------------------*/
  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setCurrentPage(p);
    const grid = document.querySelector('.product-grid');
    (grid || window).scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onTabClick = (category) => {
    setSelectedCategory(category);
    setSelectedSubCategory('');
    setHoveredCategory(null);
  };

  const onBarMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setBarHover(true);
  };

  const onBarMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setBarHover(false);
      setHoveredCategory(null);
    }, 80);
  };

  /* ------------------------------------------
   * Render
   * ----------------------------------------*/
  return (
    <div className="search-result-page">
      <Header hasSearchBar={true} mainPageHeader={true} />
      <div ref={resultsTopRef} className="results-top-anchor" aria-hidden="true" />

      {/* Category + Sort bar (hover domain) */}
      <div
        className="category-sort-wrapper"
        onMouseEnter={onBarMouseEnter}
        onMouseLeave={onBarMouseLeave}
      >
        {/* Category tabs */}
        <div className="category-tabs">
          {categories.map((category) => (
            <div
              key={category}
              className="category-tab-wrapper"
              onMouseEnter={() => setHoveredCategory(category)}
            >
              <div
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onTabClick(category)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onTabClick(category);
                }}
              >
                <span>{t(category)}</span>
              </div>

              {/* Dropdown: visible if the bar is hovered, this is the hovered tab, and category has subs */}
              {barHover &&
                hoveredCategory === category &&
                subcategoriesMap[category]?.length > 0 && (
                  <div
                    className="subcategory-dropdown"
                    onMouseEnter={() => setBarHover(true)}
                    onMouseLeave={() => setBarHover(true)} // wrapper controls closing
                  >
                    {subcategoriesMap[category]
                      .sort((a, b) => a.localeCompare(b))
                      .map((sub) => (
                        <div
                          key={sub}
                          className="subcategory-item"
                          onClick={() => {
                            setSelectedSubCategory(sub);
                            setSelectedCategory(category);
                            setHoveredCategory(null);
                            setBarHover(false);
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

        {/* Sort control (hover to open) */}
        <div
          className="sort-control"
          ref={dropdownRef}
          onMouseEnter={() => {
            // open sort; close subcategory hover domain
            if (sortHoverTimer.current) clearTimeout(sortHoverTimer.current);
            setDropdownOpen(true);
            setBarHover(false);
            setHoveredCategory(null);
          }}
          onMouseLeave={() => {
            // tiny delay = smoother exit if cursor wobbles
            sortHoverTimer.current = setTimeout(() => setDropdownOpen(false), 80);
          }}
        >
          <div className="sort-button" role="button" tabIndex={0}>
            <span className="sort-label">{sortLabel}</span>
            <span className={`sort-icon-container ${dropdownOpen ? 'open' : ''}`}>
              <img src={sortIcon} alt="Sort" />
            </span>
          </div>

          <div className={`sort-dropdown ${dropdownOpen ? 'open' : ''}`}>
            <div className="option block" />
            <div className="option" onClick={() => { setSortOption('new-arrivals'); setDropdownOpen(false); }}>
              {t('newArrivals')}
            </div>
            <div className="option" onClick={() => { setSortOption('price-asc'); setDropdownOpen(false); }}>
              {t('lowHigh')}
            </div>
            <div className="option" onClick={() => { setSortOption('price-desc'); setDropdownOpen(false); }}>
              {t('highLow')}
            </div>
          </div>
        </div>

      </div>

      {/* Search summary */}
      <div className={`search-summary ${sortedFiltered.length === 0 ? 'center' : 'left'}`}>
        <h2>
          {searchQuery?.toLowerCase() !== 'viewall' ? (
            sortedFiltered.length > 1
              ? t('searchResultsFor_plural', { length: sortedFiltered.length, searchQuery })
              : sortedFiltered.length === 0
                ? t('nothingMatched', { length: sortedFiltered.length, searchQuery })
                : t('searchResultsFor', { length: sortedFiltered.length, searchQuery })
          ) : (
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

      {/* Product grid */}
      <div className="product-grid">
        {loading
          ? Array.from({ length: 15 }).map((_, idx) => (
              <div key={idx} className="product-card skeleton">
                <div className="skeleton-image" />
                <div className="skeleton-text name" />
                <div className="skeleton-text subtitle" />
                <div className="skeleton-text price" />
              </div>
            ))
          : pagedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                t={t}
              />
            ))}
      </div>

      {/* Pagination */}
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
        </nav>
      )}

      {/* Product modal */}
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

      {/* Footer */}
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
