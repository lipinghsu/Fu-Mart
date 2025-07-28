import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { firestore } from '../../firebase/utils';
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

import i18n from '../../i18n';
import './SearchBar.scss';
import closeImage from '../../assets/closeImage2.png';
import searchIcon from '../../assets/arrowIcon4.png';

import FumartLogo from '../../assets/fumart-m-t-bg.png';
import SearchSwitchIcon from '../../assets/search-switch-icon.png';
import SearchOffIcon from '../../assets/search-off-icon.png';
import arrowImage from '../../assets/arrowIcon2.png';
import searchIcon2 from '../../assets/search-icon2-800.png';

import '../../App.scss';

const SearchBar = ({ isExpanded, setIsExpanded }) => {
  const { t } = useTranslation(['home', 'common']);
  const [query, setQuery] = useState('');
  const [topSearches, setTopSearches] = useState([]);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null); 
  const [showCursor, setShowCursor] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 520);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');


  useEffect(() => {
  const handleFocus = () => setFocused(true);
  const handleBlur = () => {
    setTimeout(() => {
      setFocused(false);
    }, 100); // allow click to register
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
  const highlightMatches = (text = '', query = '') => {
    if (!query.trim()) return text;
    // split query into unique terms
    const terms = [...new Set(query.trim().split(/\s+/))].map(escapeRegex);
    // build a regex matching any one of them
    const re = new RegExp(`(${terms.join('|')})`, 'iu');
    // split text on those terms, keeping the matches
    const parts = text.split(re);
    return parts.map((part, idx) =>
      idx % 2 === 1
        ? <strong key={idx}>{part}</strong>
        : <span key={idx}>{part}</span>
    );
  };

  useEffect(() => {
    if (!isExpanded) {
      setQuery('');
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!query.trim()) {
      setMatchedProducts([]);
      return;
    }
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

    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(Boolean);

    const exactMatches = allProducts.filter(p =>
      !p.hidden &&
      (p.name?.toLowerCase().includes(lowerQuery) ||
      p.subtitle?.toLowerCase().includes(lowerQuery))
    );

    const partialMatches = allProducts
      .filter(p => {
        if (p.hidden || exactMatches.includes(p)) return false;
        const textWords = `${p.name} ${p.subtitle}`.toLowerCase().split(/\s+/);
        return queryWords.some(word =>
          textWords.includes(word)
        );
      })
      .map(p => {
        const textWords = `${p.name} ${p.subtitle}`.toLowerCase().split(/\s+/);
        const matchCount = queryWords.filter(word =>
          textWords.includes(word)
        ).length;
        return { product: p, matchCount };
      })
      .sort((a, b) => b.matchCount - a.matchCount)
      .map(item => item.product);

      setMatchedProducts([...exactMatches, ...partialMatches].slice(0, 7));
  }, [query, allProducts]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 520);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isExpanded &&
        !e.target.closest('.cg-searchbar-container')
      ) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isExpanded]);

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
    t("Search In-Store Products"),
    t("Browse Treats From Asia"),
    t("Search by Flavor or Origin"),
    t("Uncover Hidden Gems"),
    t("Get Your Favorite Snacks")
  ];

  const [placeholder, setPlaceholder] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

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
        // 1) If a product is highlighted, go there
        if (selectedIndex >= 0 && selectedIndex < matchedProducts.length) {
          navigate(`/product/${matchedProducts[selectedIndex].id}`);
        }
        // 2) Otherwise, always trigger a search
        else {
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
}, [matchedProducts, selectedIndex, query]);


  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
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
        const q = firestoreQuery(
          searchTermsRef,
          orderBy('count', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const terms = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTopSearches(terms);
      } catch (error) {
        console.error('Error fetching top searches:', error);
      }
    };

    fetchTopSearches();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
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
        await updateDoc(docRef, {
          count: increment(1),
          lastSearched: new Date(),
          metadata
        });
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
      onClick={() => {
        if (isSmallScreen && !isExpanded) setIsExpanded(true);
      }}
    >
      <form className="cg-searchbar" onSubmit={handleSearch}>
        {isSmallScreen && !isExpanded &&
          <div className='text'>
            搜尋
        </div>}

        <div className={`logo-wrap ${isSmallScreen ? 'mobile' : ''} ${isExpanded ? 'expanded' : ''}`}>
          
          <img src={(isExpanded || !isSmallScreen) ? FumartLogo : FumartLogo} />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="cg-search-input"
          placeholder={`${isSmallScreen && !isExpanded ? 'Search' : placeholder}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
        />
        
        {(!isSmallScreen || isExpanded) && (
          <div className='cg-clear-btn-container'>
            <div
              type="button"
              className={`cg-clear-btn ${query ? 'visible' : ''}`}
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <img src={closeImage} />
            </div>
          </div>
        )}
        {(!isSmallScreen && query) && (
          <div className={`cg-search-btn-container ${query ? 'active' : ''}`}>
            <div
              type="button"
              className={`cg-search-btn ${query ? 'active' : ''}`}
              onClick={() => handleSearch()}
              aria-label="Search"
            >
              <img src={searchIcon} />
            </div>
          </div>
        )}
      </form>
      {isSmallScreen && isExpanded && (
        <div
          type="button"
          className="cg-collapse-search-btn"
          onClick={() => setIsExpanded(false)}
        >
          <div className='search-icon-wrap'>
            <img src={SearchOffIcon}/>
          </div>
          
        </div>
      )}
      

      <div className={`top-searches suggestion-dropdown ${(query && focused) ? 'active' : ''}`}>
        <div className="top-searches-list">
          {matchedProducts.map((product, index) => (
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
                  {/* ${product.price.toFixed(2)} USD */}
                  {highlightMatches(product.subtitle, query)}
                </span>                  
              </div>
              <div className='arrow-image-wrap'>
                <img
                  src={arrowImage}
                  alt="go"
                  className="product-arrow-image"
                />
              </div>
            </div>
          ))}

          {/* “Search for…” always visible when there's a query */}
          <div
            key="search-for"
            className={`top-search-product search-for active${
              selectedIndex === matchedProducts.length ? ' selected' : ''
            }`}
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
              </div>
            </div>
          </div>
  );
};

export default SearchBar;
