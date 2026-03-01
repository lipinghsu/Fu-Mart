// src/components/SearchBar/SearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { firestore } from '../../firebase/utils';
import { normalizeText, escapeRegex } from '../../utils/helpers';
import {
  collection,
  query as firestoreQuery,
  where,
  getDocs,
  addDoc,
  updateDoc,
  increment,
  doc,
  orderBy,
  limit
} from 'firebase/firestore';

import closeImage from '../../assets/Icons/closeImage2.png';
import searchIcon from '../../assets/Icons/arrowIcon4.png';
import arrowImage from '../../assets/Icons/arrowIcon2.png';
import searchIcon2 from '../../assets/Icons/search-icon2-800.png';
import FumartLogo from '../../assets/fumart-m-t-bg.png';

import './SearchBar.scss';
import '../../App.scss';

const SearchBar = ({ isExpanded, setIsExpanded, onInputChange }) => {
  const { t } = useTranslation(['home', 'common']);
  const [query, setQuery] = useState('');
  const [topSearches, setTopSearches] = useState([]);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [showCursor, setShowCursor] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 520 : true);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [placeholder, setPlaceholder] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);


  const expand = () => {
    if (isSmallScreen && !isExpanded) setIsExpanded(true);
  };
  
  useEffect(() => {
    const handleFocus = () => setFocused(true);
    const handleBlur = () => {
      setTimeout(() => setFocused(false), 100);
    };
    const input = inputRef.current;
    input?.addEventListener('focus', handleFocus);
    input?.addEventListener('blur', handleBlur);
    return () => {
      input?.removeEventListener('focus', handleFocus);
      input?.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Highlight each word in the query separately
  const highlightMatches = (text = '', q = '') => {
    if (!q.trim()) return text;
    const terms = [...new Set(q.trim().split(/\s+/))].map(escapeRegex);
    try {
      const re = new RegExp(`(${terms.join('|')})`, 'giu');
      const parts = String(text).split(re);
      return parts.map((part, idx) =>
        idx % 2 === 1 ? <strong key={idx}>{part}</strong> : <span key={idx}>{part}</span>
      );
    } catch {
      return text;
    }
  };

  useEffect(() => {
    if (isExpanded) {
      // When it expands, focus the input
      inputRef.current?.focus();
    } else {
      // When it collapses, clear the query
      setQuery('');
    }
  }, [isExpanded]);

  // EFFECT 1: Fetch all products ONCE when component mounts
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, 'products'));
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllProducts(products);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchAllProducts();
  }, []); // Empty dependency array runs this only once

  // EFFECT 2: Filter products whenever 'query' or 'allProducts' changes
  useEffect(() => {
    if (!query.trim()) {
      setMatchedProducts([]);
      return;
    }

    // Use the new normalization function on the query
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      setMatchedProducts([]);
      return;
    }

    // Filter the product list
    const matches = allProducts
      .filter(p => {
        if (p.hidden) return false;
        
        // Combine and normalize the product's searchable text
        const productName = normalizeText(p.name);
        const productSubtitle = normalizeText(p.subtitle);
        const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
        return queryTerms.every(term => (productName + productSubtitle).includes(term));
      })
      .slice(0, 7); // Get the top 7 matches

    setMatchedProducts(matches);
  }, [query, allProducts]); 

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 520);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isExpanded && !e.target.closest('.cg-searchbar-container')) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isExpanded, setIsExpanded]);

  const getMetadata = () => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: {
      width: window.innerWidth,
      height: window.innerHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    deviceMemory: navigator.deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    referrer: document.referrer || 'direct',
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    connection: navigator.connection
      ? {
          downlink: navigator.connection.downlink,
          effectiveType: navigator.connection.effectiveType,
          rtt: navigator.connection.rtt
        }
      : 'unknown'
  });

  const phrases = [
    t('Search In-Store Products'),
    t('Discover Treats From East Asia'),
    t('Browse by Brand or Origin'),
    t('Uncover Hidden Gems'),
    t('Get Your Favorite Snacks')
  ];

  useEffect(() => {
    const totalItems = matchedProducts.length + (query.trim() ? 1 : 0);
    const handleKeyDown = (e) => {
      if (!query.trim()) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < matchedProducts.length) {
            navigate(`/product/${matchedProducts[selectedIndex].id}`);
          } else {
            handleSearch(e);
          }
          break;
        default:
          break;
      }
    };
    const inputEl = inputRef.current;
    inputEl?.addEventListener('keydown', handleKeyDown);
    return () => inputEl?.removeEventListener('keydown', handleKeyDown);
  }, [matchedProducts, selectedIndex, query, navigate]);

  useEffect(() => {
    const cursorInterval = setInterval(() => setShowCursor(prev => !prev), 500);
    return () => clearInterval(cursorInterval);
  }, []);


  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timer;

    if (isDeleting) {
      if (charIndex > 0) {
        timer = setTimeout(() => {
          setPlaceholder(currentPhrase.substring(0, charIndex - 1));
          setCharIndex(prev => prev - 1);
        }, 40);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIndex(prev => (prev + 1) % phrases.length);
        }, 500);
      }
    } else {
      if (charIndex < currentPhrase.length) {
        timer = setTimeout(() => {
          setPlaceholder(currentPhrase.substring(0, charIndex + 1));
          setCharIndex(prev => prev + 1);
        }, 60);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fetchTopSearches = async () => {
      try {
        const searchTermsRef = collection(firestore, 'searchTerms');
        const q = firestoreQuery(searchTermsRef, orderBy('count', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const terms = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTopSearches(terms);
      } catch (error) {
        console.error('Error fetching top searches:', error);
      }
    };
    fetchTopSearches();
  }, []);

  const handleSearch = async (e, customTerm = null) => {
    if (e) e.preventDefault();
    const searchTerm = (customTerm || query).trim();
    if (!searchTerm) return;
    const metadata = getMetadata();
    try {
      const searchTermsRef = collection(firestore, 'searchTerms');
      const q = firestoreQuery(searchTermsRef, where('term', '==', searchTerm.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(firestore, 'searchTerms', docId);
        await updateDoc(docRef, { count: increment(1), lastSearched: new Date(), metadata });
      } else {
        await addDoc(searchTermsRef, {
          term: searchTerm.toLowerCase(),
          count: 1,
          createdAt: new Date(),
          lastSearched: new Date(),
          metadata
        });
      }
    } catch (error) {
      console.error('Error logging search term:', error);
    }
    setQuery('');
    navigate(`/search?term=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div
      className={`cg-searchbar-container ${isSmallScreen ? 'mobile' : ''} ${isExpanded ? 'expanded' : ''} ${query ? 'active' : ''}`}
      onClick={expand}
    >
      <form className="cg-searchbar" onSubmit={handleSearch}>
        {isSmallScreen && !isExpanded && (
          <div
            className="text"
            role="button"
            tabIndex={0}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              expand();
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                expand();
                setTimeout(() => inputRef.current?.focus(), 0);
              }
            }}
          >
            {t('Search')}
          </div>
        )}

        <div
          className={`logo-wrap ${isSmallScreen ? 'mobile' : ''} ${isExpanded ? 'expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            expand();
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <img src={FumartLogo} alt="logo" />
        </div>

        <input
          ref={inputRef}
          type="text"
          className="cg-search-input"
          placeholder={`${isSmallScreen && !isExpanded ? 'Search' : placeholder}`}
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (onInputChange) onInputChange(value);
          }}
          onFocus={() => { setFocused(true); expand(); }}
        />

        {(!isSmallScreen || isExpanded) && (
          <div className='cg-clear-btn-container'>
            <div
              type="button"
              className={`cg-clear-btn ${(query || isExpanded) ? 'visible' : ''}`}
              onClick={() => { setQuery(''); setIsExpanded(false); }}
              aria-label="Clear search"
            >
              <img src={closeImage} alt="clear" />
            </div>
          </div>
        )}

        {!isSmallScreen && (
          <div className={`cg-search-btn-container ${query ? 'active' : ''}`}>
            <div
              type="button"
              className={`cg-search-btn ${query ? 'active' : ''}`}
              onClick={() => handleSearch()}
              aria-label="Search"
            >
              <img src={searchIcon} alt="search" />
            </div>
          </div>
        )}
      </form>

      <div
        className={`top-searches suggestion-dropdown ${(query && focused) ? 'active' : ''}`}
        onMouseLeave={() => setSelectedIndex(-1)}
      >
        <div className="top-searches-list">
          {matchedProducts.filter((product) => !product.isHidden)
          .map((product, index) => (
            <div
              key={product.id}
              className={`top-search-product${selectedIndex === index ? ' selected' : ''} active`}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <img
                src={product.images?.[0]}
                alt={product.name}
                className="product-thumbnail"
              />
              <div className='product-details'>
                <span className='product-name'>
                  {highlightMatches(product.name, query)}
                </span>
                <span className='product-price'>
                  {highlightMatches(product.subtitle, query)}
                </span>
              </div>
              <div className='arrow-image-wrap'>
                <img src={arrowImage} alt="go" className="product-arrow-image" />
              </div>
            </div>
          ))}

          {/* “Search for …” */}
          {query.trim() && (
            <div
              key="search-for"
              className={`top-search-product search-for active${selectedIndex === matchedProducts.length ? ' selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(matchedProducts.length)}
              onClick={() => handleSearch()}
            >
              <img src={searchIcon2} alt="search" className="product-thumbnail" />
              <div className='product-details search-for'>
                {t('searchFor', { query })}
              </div>
              <div className='arrow-image-wrap'>
                <img src={arrowImage} alt="go" className="product-arrow-image" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
