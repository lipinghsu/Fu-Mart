import React, { useState, useEffect } from 'react';
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
import '../../App.scss';

const SearchBar = () => {
  const { t } = useTranslation(['home', 'common']);
  const [query, setQuery] = useState('');
  const [topSearches, setTopSearches] = useState([]);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchTopSearches = async () => {
      try {
        const searchTermsRef = collection(firestore, 'searchTerms');
        const q = firestoreQuery(
          searchTermsRef,
          orderBy('count', 'desc'),
          limit(10) // top 10 searches
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

  // Filter top searches based on current query for suggestions
  const filteredSuggestions = query
    ? topSearches.filter(item =>
        item.term.toLowerCase().includes(query.toLowerCase())
      )
    : topSearches;

  return (
    <div className="cg-searchbar-container">
      <form className="cg-searchbar" onSubmit={handleSearch}>
        <input
          type="text"
          className="cg-search-input"
          placeholder={t('searchPlaceholder') || 'Search In-Store Products'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
        <div className='cg-claer-btn-container'>
          <div
            type="button"
            className={`cg-clear-btn ${query ? 'visible' : ''}`}
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <img src={closeImage} />
          </div>

        </div>


        <button type="submit" className="cg-search-btn">
          {t('search') || 'Search'}
        </button>
      </form>

      {/* {focused && (
        <div className="top-searches">
          <p>{t('popularSearches') || 'Suggestions:'}</p>
          <div className="top-searches-list">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item) => (
                <button
                  key={item.id}
                  className="top-search-term"
                  onClick={() => handleSearch(null, item.term)}
                >
                  {item.term}
                </button>
              ))
            ) : (
              <span className="no-suggestions">{t('noSuggestions') || 'No suggestions'}</span>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
};

export default SearchBar;
