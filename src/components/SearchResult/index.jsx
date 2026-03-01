// src/components/SearchResult/index.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';
import { normalizeText } from '../../utils/helpers';

import Header from '../Header';
import Footer from '../Footer';
import ProductCard from '../ProductCard';
import ProductModal from '../ProductModal';
import FilterSidebar from './FilterSidebar';
import SearchSummary from './SearchSummary';
import SubcategoryDropdown from './SubcategoryDropdown';

import sortIcon from '../../assets/Icons/arrowIcon.png';
import filterIcon from '../../assets/Icons/filter-icon.png';
import arrowIcon from '../../assets/Icons/arrowIcon2i.png';
import openFilterIcon from '../../assets/Icons/openFilterIcon.png';
import closeFilterIcon from '../../assets/Icons/closeFilterIcon.png';

import './SearchResult.scss';

/* ------------------------------------------
 * Helpers
 * ----------------------------------------*/
const arrEq = (a = [], b = []) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const filtersEq = (a, b) =>
  a?.priceMin === b?.priceMin &&
  a?.priceMax === b?.priceMax &&
  arrEq(a?.priceRanges, b?.priceRanges) &&
  arrEq(a?.brands, b?.brands) &&
  arrEq(a?.origins, b?.origins);

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
    case 'price-asc': return 'lowHigh';
    case 'price-desc': return 'highLow';
    case 'name-asc': return 'aToZ';
    case 'name-desc': return 'zToA';
    default: return 'newArrivals';
  }
};

const sortProducts = (arr, sortOption) => {
  return [...arr].sort((a, b) => {
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
};

/* ---------- Price range presets (OR filter) ---------- */
const PRICE_RANGES = {
  under5: { min: null, max: 5 },
  r5_20: { min: 5, max: 20 },
  r20_50: { min: 20, max: 50 },
  over50: { min: 50, max: null },
};

const priceInRange = (price, rangeKey) => {
  const r = PRICE_RANGES[rangeKey];
  if (!r) return false;
  const p = Number(price ?? 0);
  if (!Number.isFinite(p)) return false;
  const minOk = r.min == null ? true : p >= r.min;
  const maxOk = r.max == null ? true : p <= r.max;
  return minOk && maxOk;
};

/* ---------- URL helpers ---------- */
const parseArray = (s) => (s ? s.split(',').map(v => v.trim()).filter(Boolean) : []);

const readParams = (sp) => {
  const sort = sp.get('sort') || 'new-arrivals';
  const catParam = sp.get('cat') || '';
  const sub = sp.get('sub') || '';

  const priceMin = sp.get('priceMin');
  const priceMax = sp.get('priceMax');
  const priceRanges = parseArray(sp.get('priceRanges'));

  const brands = parseArray(sp.get('brands'));
  const origins = parseArray(sp.get('origins'));

  const page = parseInt(sp.get('page') || '1', 10);

  return {
    sort,
    catParam,
    sub,
    filters: {
      priceMin: priceMin === null || priceMin === '' ? '' : Number(priceMin),
      priceMax: priceMax === null || priceMax === '' ? '' : Number(priceMax),
      priceRanges,
      brands,
      origins,
    },
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
};

const writeParams = (sp, { sort, catParam, sub, filters, page }) => {
  const setOrDel = (key, val) => {
    if (
      val === undefined ||
      val === null ||
      val === '' ||
      (Array.isArray(val) && val.length === 0)
    ) {
      sp.delete(key);
    } else {
      sp.set(key, String(val));
    }
  };

  setOrDel('sort', sort && sort !== 'new-arrivals' ? sort : '');
  setOrDel('cat', catParam && catParam !== 'all' ? catParam : '');
  setOrDel('sub', sub);

  setOrDel('priceMin', filters?.priceMin === '' ? '' : filters?.priceMin);
  setOrDel('priceMax', filters?.priceMax === '' ? '' : filters?.priceMax);
  setOrDel('priceRanges', Array.isArray(filters?.priceRanges) ? filters.priceRanges.join(',') : '');
  setOrDel('brands', Array.isArray(filters?.brands) ? filters.brands.join(',') : '');
  setOrDel('origins', Array.isArray(filters?.origins) ? filters.origins.join(',') : '');

  setOrDel('page', page && page !== 1 ? page : '');
  return sp;
};

/* ------------------------------------------
 * Component
 * ----------------------------------------*/
const PAGE_SIZE = 60;
const SALE_CATEGORY = '__ON_SALE__';

const SearchResult = ({ searchQuery }) => {
  const { t, i18n } = useTranslation(['storefront', 'common']);
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    priceRanges: [],
    brands: [],
    origins: [],
  });

  const brandKey = (s = '') =>
  String(s)
    .normalize('NFKC')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const [filterOpen, setFilterOpen] = useState(false);

  const hasActiveFilters = useMemo(() => {
    const { priceMin, priceMax, priceRanges, brands, origins } = filters || {};
    return (
      (priceMin !== '' && priceMin !== null && priceMin !== undefined) ||
      (priceMax !== '' && priceMax !== null && priceMax !== undefined) ||
      (Array.isArray(priceRanges) && priceRanges.length > 0) ||
      (Array.isArray(brands) && brands.length > 0) ||
      (Array.isArray(origins) && origins.length > 0)
    );
  }, [filters]);

  const tEn = useMemo(() => i18n.getFixedT('en', ['storefront', 'common']), [i18n]);
  const enCollator = useMemo(() => new Intl.Collator('en', { sensitivity: 'base', numeric: true }), []);

  const sortHoverTimer = useRef(null);
  const dropdownRef = useRef(null);
  const resultsTopRef = useRef(null);
  const closeTimer = useRef(null);

  /* Data */
  const [products, setProducts] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState({});

  /* Brand images from Firestore brands collection */
  const [brandMetaMap, setBrandMetaMap] = useState({});

  /* UI selections */
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOption, setSortOption] = useState('new-arrivals');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);

  /* UI toggles */
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterHover, setFilterHover] = useState(false);
  const [barHover, setBarHover] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 520);

  /* Derived labels */
  const allCategoryLabel = t('allCategory');
  const sortLabel = t(getSortLabelKey(sortOption));

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(() => 1);

  /* Detect screen width change */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 520px)');
    const handleResize = (e) => setIsMobile(e.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  /* ---------- Load products ---------- */
  useEffect(() => {
    const productsRef = collection(firestore, 'products');
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(all);
        setLoading(false);
      },
      (err) => {
        console.error('Error in products listener:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  

  /* ---------- Load brand images from /brands ---------- */
  useEffect(() => {
    const brandsRef = collection(firestore, 'brands');

    const unsub = onSnapshot(
      brandsRef,
      (snap) => {
        const next = {};

        snap.docs.forEach((d) => {
          const data = d.data() || {};
          const imageUrl = data.imageUrl;
          const invert = Boolean(data.invert);

          if (!imageUrl) return;

          const meta = { imageUrl, invert };

          // include more possible keys + normalize them
          const keys = [
            d.id,
            data.asciiSlug,
            data.name,
            data.brand,
            data.brandName,
          ].filter(Boolean);

          keys.forEach((k) => {
            const nk = brandKey(k);
            if (!nk) return;

            if (!next[nk]) next[nk] = meta;

            // extra: also store a compact version (removes all whitespace)
            const compact = nk.replace(/\s+/g, '');
            if (!next[compact]) next[compact] = meta;
          });
        });


        setBrandMetaMap(next);
      },
      (err) => console.error('Error in brands listener:', err)
    );

    return () => unsub();
  }, []);


  /* ---------- Init state from URL ---------- */
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const { sort, catParam, sub, filters: f, page } = readParams(sp);

    setSortOption((prev) => (prev !== sort ? sort : prev));

    const catFromUrl =
      catParam === 'sale'
        ? SALE_CATEGORY
        : catParam === 'all'
          ? allCategoryLabel
          : (catParam || '');

    if (catFromUrl && selectedCategory !== catFromUrl) setSelectedCategory(catFromUrl);
    if (sub && selectedSubCategory !== sub) setSelectedSubCategory(sub);

    setFilters((prev) => (filtersEq(prev, f) ? prev : {
      priceMin: f.priceMin,
      priceMax: f.priceMax,
      priceRanges: f.priceRanges || [],
      brands: f.brands,
      origins: f.origins,
    }));

    if (currentPage !== page) setCurrentPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, allCategoryLabel]);

  /* ---------- Keep page in URL ---------- */
  const getPageFromSearch = () => {
    const sp = new URLSearchParams(location.search);
    const p = parseInt(sp.get('page') || '1', 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  };

  const setPageInSearch = (page, { replace = false } = {}) => {
    const sp = new URLSearchParams(location.search);
    if (page === 1) sp.delete('page');
    else sp.set('page', String(page));
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` }, { replace });
  };

  useEffect(() => {
    const initP = getPageFromSearch();
    if (initP !== currentPage) setCurrentPage(initP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Search + build subcategories ---------- */
  useEffect(() => {
    if (!products.length) {
      setFilteredResults([]);
      setSubcategoriesMap({});
      return;
    }

    if (searchQuery && searchQuery.toLowerCase() === 'viewall') {
      setFilteredResults(products);
      setSubcategoriesMap(buildSubcategoryMap(products));
      return;
    }

    if (!searchQuery) {
      setFilteredResults([]);
      setSubcategoriesMap({});
      return;
    }

    const normalizedQuery = normalizeText(searchQuery);
    const matched = products.filter(p => {
      const productName = normalizeText(p.name);
      const productSubtitle = normalizeText(p.subtitle);
      return (productName + productSubtitle).includes(normalizedQuery);
    });

    setFilteredResults(matched);
    setSubcategoriesMap(buildSubcategoryMap(matched));
  }, [searchQuery, products]);

  /* ---------- Default "All" category when ready ---------- */
  useEffect(() => {
    if (selectedCategory === '' && allCategoryLabel && filteredResults.length > 0) {
      setSelectedCategory(allCategoryLabel);
    }
  }, [selectedCategory, allCategoryLabel, filteredResults.length]);

  /* ---------- Reset subcategory when switching to "All" ---------- */
  useEffect(() => {
    if (selectedCategory === allCategoryLabel) setSelectedSubCategory('');
  }, [selectedCategory, allCategoryLabel]);

  /* ---------- Reset page when dependencies change ---------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, selectedCategory, selectedSubCategory, filteredResults.length]);

  /* ---------- Scroll to top on page change ---------- */
  useEffect(() => {
    if (!loading) {
      if (resultsTopRef.current) {
        const headerHeight = 80;
        const elementPosition = resultsTopRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage, loading]);

  /* ---------- Derived scope (category/sub/sale) ---------- */
  const availableBase = useMemo(() => {
    return filteredResults.filter((product) => {
      const isSale = Number(product?.priceDiscount) > 0;

      const categoryOk =
        selectedCategory === allCategoryLabel
          ? true
          : selectedCategory === SALE_CATEGORY
            ? true
            : product.category === selectedCategory;

      const subOk = !selectedSubCategory || product.subCategory === selectedSubCategory;
      const saleOk = selectedCategory === SALE_CATEGORY ? isSale : true;

      return categoryOk && subOk && saleOk;
    });
  }, [filteredResults, selectedCategory, selectedSubCategory, allCategoryLabel]);

  /* ---------- Available price presets based on current grid (excluding price filters) ---------- */
  const availableForPrice = useMemo(() => {
    return availableBase.filter((product) => {
      const brandOk = !filters.brands?.length ? true : filters.brands.includes(product?.brand ?? '');
      const originOk = !filters.origins?.length ? true : filters.origins.includes(product?.origin ?? '');
      return brandOk && originOk;
    });
  }, [availableBase, filters.brands, filters.origins]);

  const availablePriceRanges = useMemo(() => {
    const prices = availableForPrice.map(p => Number(p?.price)).filter(Number.isFinite);
    const keys = Object.keys(PRICE_RANGES);
    return keys.filter((k) => prices.some((price) => priceInRange(price, k)));
  }, [availableForPrice]);

  const availableOrigins = useMemo(() => {
    return [...new Set(availableBase.map(p => p.origin).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [availableBase]);

  const availableBrands = useMemo(() => {
    return [...new Set(availableBase.map(p => p.brand).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [availableBase]);

  useEffect(() => {
    if (loading) return;
    if (products.length > 0 && filteredResults.length === 0) return;
    if (filteredResults.length > 0 && !selectedCategory) return;

    setFilters((prev) => {
      const nextOrigins = (prev.origins || []).filter((o) => availableOrigins.includes(o));
      const nextBrands = (prev.brands || []).filter((b) => availableBrands.includes(b));

      const sameOrigins = nextOrigins.length === (prev.origins || []).length;
      const sameBrands = nextBrands.length === (prev.brands || []).length;
      if (sameOrigins && sameBrands) return prev;

      return { ...prev, origins: nextOrigins, brands: nextBrands };
    });
  }, [
    availableOrigins, 
    availableBrands, 
    loading, 
    products.length,       
    filteredResults.length,
    selectedCategory       
  ]);

  useEffect(() => {
    if (loading) return;

    setFilters((prev) => {
      const nextOrigins = prev.origins || [];
      const nextBrands = prev.brands || [];

      const sameOrigins = nextOrigins.length === (prev.origins || []).length;
      const sameBrands = nextBrands.length === (prev.brands || []).length;
      
      if (sameOrigins && sameBrands) return prev;

      return { ...prev, origins: nextOrigins, brands: nextBrands };
    });
  }, [
    availableOrigins, 
    availableBrands, 
    loading
  ]);

  /* ---------- Sorted + filtered products ---------- */
  const sortedFiltered = useMemo(() => {
    const scoped = filteredResults.filter(product => {
      const isSale = Number(product?.priceDiscount) > 0;

      const categoryOk =
        selectedCategory === allCategoryLabel
          ? true
          : selectedCategory === SALE_CATEGORY
            ? true
            : product.category === selectedCategory;

      const subOk = !selectedSubCategory || product.subCategory === selectedSubCategory;
      const saleOk = selectedCategory === SALE_CATEGORY ? isSale : true;

      const price = Number(product?.price ?? 0);

      const ranges = Array.isArray(filters.priceRanges) ? filters.priceRanges : [];
      const rangeOk = ranges.length === 0 ? true : ranges.some((rk) => priceInRange(price, rk));

      const minOk = ranges.length ? true : (filters.priceMin === '' ? true : price >= Number(filters.priceMin));
      const maxOk = ranges.length ? true : (filters.priceMax === '' ? true : price <= Number(filters.priceMax));

      const brandOk = !filters.brands?.length ? true : filters.brands.includes(product?.brand ?? '');
      const originOk = !filters.origins?.length ? true : filters.origins.includes(product?.origin ?? '');

      return categoryOk && subOk && saleOk && rangeOk && minOk && maxOk && brandOk && originOk;
    });

    return sortProducts(scoped, sortOption);
  }, [
    filteredResults,
    selectedCategory,
    selectedSubCategory,
    sortOption,
    allCategoryLabel,
    filters.priceMin,
    filters.priceMax,
    filters.priceRanges,
    filters.brands,
    filters.origins,
  ]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE)),
    [sortedFiltered.length]
  );

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedFiltered.slice(start, start + PAGE_SIZE);
  }, [sortedFiltered, currentPage]);

  const getPageNumbers = () => {
    const total = totalPages;
    const current = currentPage;
    const center = Math.floor(total / 2);
    const pages = new Set();

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.add(i);
      return Array.from(pages).sort((a, b) => a - b);
    }

    pages.add(1);
    pages.add(total);
    pages.add(center);

    pages.add(current);
    if (current > 1) pages.add(current - 1);
    if (current < total) pages.add(current + 1);
    if (current === 2 && total >= 3) pages.add(3);
    if (current === total - 1 && total > 2) pages.add(total - 2);

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      result.push(sorted[i]);
      if (i < sorted.length - 1 && sorted[i + 1] !== sorted[i] + 1) result.push('…');
    }
    return result;
  };

  const tabs = useMemo(() => {
    const baseCats = [...new Set(filteredResults.map(p => p.category).filter(Boolean))];
    const sortable = [
      { id: allCategoryLabel, label: t('allCategory'), sortKey: tEn('allCategory') || 'All' },
      ...baseCats.map(c => ({ id: c, label: t(c), sortKey: tEn(c) || String(c) })),
    ].sort((a, b) => enCollator.compare(a.sortKey, b.sortKey));

    const saleTab = { id: SALE_CATEGORY, label: t('Sale') || 'Sale', sortKey: 'Sale' };
    return [...sortable, saleTab];
  }, [filteredResults, allCategoryLabel, t, tEn, enCollator]);

  /* ---------- URL sync on state changes ---------- */
  useEffect(() => {
    const sp = new URLSearchParams(location.search);

    // [DEBUG] Check what we are about to write
    if (filters.brands.length === 0 && location.search.includes('brands=')) {
        console.error('🚨 [DEBUG] URL SYNC: Wiping brands from URL!', {
            currentUrl: location.search,
            newFilters: filters
        });
    }

    const catParam =
      selectedCategory === SALE_CATEGORY ? 'sale'
        : selectedCategory === allCategoryLabel ? 'all'
          : (selectedCategory || '');

    writeParams(sp, {
      sort: sortOption,
      catParam,
      sub: selectedSubCategory || '',
      filters,
      page: 1,
    });

    navigate({ pathname: location.pathname, search: `?${sp.toString()}` }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortOption,
    selectedCategory,
    selectedSubCategory,
    filters.priceMin,
    filters.priceMax,
    filters.priceRanges,
    filters.brands,
    filters.origins,
    allCategoryLabel,
  ]);

  /* ---------- FLIP animation ---------- */
  const useFlipGrid = (deps = []) => {
    const positionsRef = useRef(new Map());

    const capture = () => {
      const nodes = document.querySelectorAll('[data-flip-id]');
      const next = new Map();
      nodes.forEach((el) => next.set(el.dataset.flipId, el.getBoundingClientRect()));
      positionsRef.current = next;
    };

    const play = () => {
      const prev = positionsRef.current;
      const nodes = document.querySelectorAll('[data-flip-id]');
      nodes.forEach((el) => {
        const id = el.dataset.flipId;
        const oldBox = prev.get(id);
        if (!oldBox) return;
        const newBox = el.getBoundingClientRect();
        const dx = oldBox.left - newBox.left;
        const dy = oldBox.top - newBox.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0px, 0px)' }],
          { duration: 260, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)' }
        );
      });
    };

    useEffect(() => {
      requestAnimationFrame(() => requestAnimationFrame(play));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { capture };
  };

  const { capture: captureFlip } = useFlipGrid([
    filterOpen,
    currentPage,
    sortOption,
    selectedCategory,
    selectedSubCategory,
    filters,
  ]);

  /* ------------------------------------------
   * UI handlers
   * ----------------------------------------*/
  const goToPage = (p) => {
    const total = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
    const safe = Math.min(Math.max(1, p), total);
    if (safe === currentPage) return;
    setCurrentPage(safe);
    setPageInSearch(safe);

    if (resultsTopRef.current) {
      const headerOffset = 80;
      const elementTop = resultsTopRef.current.getBoundingClientRect().top;
      const scrollTarget = elementTop + window.pageYOffset - headerOffset;
      window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filterIconSrc = useMemo(() => {
    if (filterHover && !filterOpen) return openFilterIcon;
    if (filterHover && filterOpen) return closeFilterIcon;
    if (filterOpen) return closeFilterIcon;
    return filterIcon;
  }, [filterHover, filterOpen]);

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

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('preferredTheme') === 'dark'
  );

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('preferredTheme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-mode', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  /* ------------------------------------------
   * Render
   * ----------------------------------------*/
  const isDropdownActive =
    barHover &&
    hoveredCategory &&
    subcategoriesMap[hoveredCategory]?.length > 0;

  return (
    <div className="search-result-page">
      <Header
        hasSearchBar
        mainPageHeader
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div ref={resultsTopRef} className="results-top-anchor" aria-hidden="true" />

      <div
        className="category-sort-wrapper"
        onMouseEnter={onBarMouseEnter}
        onMouseLeave={onBarMouseLeave}
      >
        <div className="category-tabs">
          {tabs.map(({ id, label }) => {
            const isSale = id === SALE_CATEGORY;
            return (
              <div
                key={id}
                className={`category-tab-wrapper ${isSale ? 'sales-tab-wrapper' : ''}`}
                onMouseEnter={() => setHoveredCategory(id)}
              >
                <div
                  className={`category-tab ${selectedCategory === id ? 'active' : ''} ${
                    hoveredCategory === id && barHover ? 'hovered' : ''
                  } ${isSale ? 'sale-tab' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onTabClick(id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTabClick(id)}
                >
                  <span>{label}</span>
                </div>

                {barHover &&
                  hoveredCategory === id &&
                  subcategoriesMap[id]?.length > 0 && (
                    <SubcategoryDropdown
                      subs={subcategoriesMap[id]
                        .slice()
                        .sort((a, b) => enCollator.compare(tEn(a) || a, tEn(b) || b))}
                      categoryId={id}
                      t={t}
                      setBarHover={setBarHover}
                      onSelect={(sub) => {
                        setSelectedSubCategory(sub);
                        setSelectedCategory(id);
                        setHoveredCategory(null);
                        setBarHover(false);
                      }}
                    />
                  )}
              </div>
            );
          })}
        </div>

        <div className={`right-controls ${isMobile ? 'mobile' : ''}`}>
          <div
            className={`sort-control ${dropdownOpen ? 'open' : ''}`}
            ref={dropdownRef}
            onMouseEnter={(e) => {
              if (e.target.closest('.sort-dropdown')) return;
              if (sortHoverTimer.current) clearTimeout(sortHoverTimer.current);
              setDropdownOpen(true);
              setBarHover(false);
              setHoveredCategory(null);
            }}
            onMouseLeave={() => {
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

          <div className={`filter-tab-wrapper ${hasActiveFilters ? 'active' : ''}`} onMouseEnter={() => setBarHover(false)}>
            <div
              type="button"
              className={`filter-tab ${hasActiveFilters ? 'active' : ''} ${filterOpen ? 'filter-open' : ''}`}
              aria-label={t('filter') || 'Filter'}
              aria-pressed={filterOpen || hasActiveFilters}
              onMouseEnter={() => setFilterHover(true)}
              onMouseLeave={() => setFilterHover(false)}
              onClick={() => {
                captureFlip();
                setFilterOpen(v => !v);
              }}
            >
              <img src={filterIconSrc} alt={t('filter') || 'Filter'} />
              <div className="filter-tooltip">
                {filterOpen 
                  ? (t('Collapse') || 'Collapse') 
                  : (t('Expand') || 'Expand')
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`results-layout ${filterOpen ? 'sidebar-open' : 'sidebar-closed'} ${isDropdownActive ? 'blurred' : ''}`}>
        <FilterSidebar
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onChange={(v) => {
            captureFlip();
            setFilters(v);
            setCurrentPage(1);
            setPageInSearch(1, { replace: true });
          }}
          onClear={() => {
            captureFlip();
            setFilters({ priceMin: '', priceMax: '', priceRanges: [], brands: [], origins: [] });
            setCurrentPage(1);
            setPageInSearch(1, { replace: true });
          }}
          allBrands={availableBrands}
          allOrigins={availableOrigins}
          allPrices={filteredResults.map((p) => Number(p?.price)).filter(Number.isFinite)}
          availablePriceRanges={availablePriceRanges}
          brandMetaMap={brandMetaMap}
          currency="$"
          value={filters}
          t={t}
        />

        <div className={`grid-area ${filterOpen ? 'sidebar-open' : 'sidebar-closed'} ${isDropdownActive ? 'blurred' : ''}`}>
          <SearchSummary
            loading={loading}
            sortedLength={sortedFiltered.length}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            allCategoryLabel={allCategoryLabel}
            SALE_CATEGORY={SALE_CATEGORY}
            isDropdownActive={isDropdownActive}
            t={t}
            translateCategory={(c) => t(c) || c}
          />

          <div className="product-grid">
            {loading
              ? Array.from({ length: 15 }).map((_, idx) => (
                <div key={idx} className="product-card skeleton sr">
                  <div className="skeleton-image" />
                  <div className="skeleton-text name" />
                  <div className="skeleton-text subtitle" />
                  <div className="skeleton-text price" />
                </div>
              ))
              : pagedProducts
                .filter((product) => !product.isHidden)
                .map((product) => (
                  <div key={product.id} data-flip-id={product.id}>
                    <ProductCard
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                      t={t}
                    />
                  </div>
                ))}
          </div>
        </div>
      </div>

      {!loading && sortedFiltered.length > PAGE_SIZE && (
        <nav className="pagination" aria-label="Product pagination">
          <button className="page-nav" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
            <img src={arrowIcon} className="left" alt="" />
          </button>

          <div className="page-list" role="list">
            {getPageNumbers().map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="page-ellipsis">⋯</span>
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

          <button className="page-nav" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
            <img src={arrowIcon} alt="" />
          </button>
        </nav>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(product, qty) => console.log('Add to cart:', product, qty)}
          onBuyNow={(product, qty) => console.log('Buy now:', product, qty)}
          onSelectSuggested={(product) => setSelectedProduct(product)}
          isDarkMode={isDarkMode}
          allProducts={sortedFiltered}
          setSelectedProduct={setSelectedProduct}
        />
      )}

      <Footer isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  );
};

export default SearchResult;
