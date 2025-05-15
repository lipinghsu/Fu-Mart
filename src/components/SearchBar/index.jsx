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
import FumartLogo from '../../assets/fumart-m-red-bg.png';
import SearchSwitchIcon from '../../assets/search-switch-icon.png';
// import SearchSwitchIcon from '../../assets/search-icon.png';
import SearchOffIcon from '../../assets/search-off-icon.png';
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
    'Search In-Store Products',
    'Browse Treats From Asia',
    'Search by Flavor',
    'Uncover Hidden Gems',
    'Grandma-Approved Picks',
    'Find Popular Treasures',
    'Get Your Favorite Snacks'
  ];

  const [placeholder, setPlaceholder] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

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

    navigate(`/search?term=${encodeURIComponent(searchTerm)}`);
  };

  const filteredSuggestions = query
    ? topSearches.filter(item =>
        item.term.toLowerCase().includes(query.toLowerCase())
      )
    : topSearches;

  return (
    <div
      className={`cg-searchbar-container ${isSmallScreen ? 'mobile' : ''} ${isExpanded ? 'expanded' : ''}`}
      onClick={() => {
        if (isSmallScreen && !isExpanded) setIsExpanded(true);
      }}
    >
      <form className="cg-searchbar" onSubmit={handleSearch}>
        <div className={`logo-wrap ${isSmallScreen ? 'mobile' : ''} ${isExpanded ? 'expanded' : ''}`}>
          <img src={(isExpanded || !isSmallScreen) ? FumartLogo : SearchSwitchIcon} />
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
    </div>
  );
};

export default SearchBar;
