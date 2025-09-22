import React, { useState, useRef, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';

import Header from './../Header';
import Footer from './../Footer';
import JoinUsModal from './JoinUsModal';
import LatestProducts from './LatestProducts'; 
import RecommendedCategories from './RecommendedCategories';
import RecommendedProducts from './RecommendedProducts';

// import topSectionImage from './../../assets/.png';
import topSectionText from './../../assets/tpc-metal.png';

import './Directory.scss';

let hasShownJoinModalThisSession = false;

const Directory = ({}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    return savedTheme === 'dark';
  });
  const { t } = useTranslation(['home', 'storefront']);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [latestProducts, setLatestProducts] = useState([]);

  // 3) Fetch latest products…
  const fetchLatestProducts = async () => {
    try {
      const q = query(
        collection(firestore, 'products'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const products = [];
      snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
      setLatestProducts(products);
    } catch (error) {
      console.error('Error fetching latest products:', error);
    }
  };

  // join-modal
  useEffect(() => {
    fetchLatestProducts();
    const lastShown = localStorage.getItem('joinUsLastShown');
    const now = Date.now();
    const oneHour = 1000 * 60 * 60;
    if (
      !hasShownJoinModalThisSession &&
      (!lastShown || now - parseInt(lastShown, 10) > oneHour)
    ) {
      hasShownJoinModalThisSession = true;
      setTimeout(() => setShowSignupModal(true), 7102);
    }
  }, []);

  // 6) Dark-mode toggle
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark-mode', newMode);
    localStorage.setItem('preferredTheme', newMode ? 'dark' : 'light');
  };

  // 7) Disable scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showSignupModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showSignupModal]);

  return (
    <div className="cg-root">
      <div className="directory">
        <Header title={t('title')} 
          mainPageHeader 
          hasSearchBar 
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <div className="cg-main">
          <div className="top-section">

            <div className="top-section-text">
              <img src={topSectionText} alt="banner" />
            </div>
          </div>
          {/* <LatestProducts products={latestProducts} /> */}
          <RecommendedProducts products={latestProducts} />
          {/* <RecommendedCategories /> */}
        </div>
        <Footer
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          showFull
        />
        {showSignupModal && (
          <JoinUsModal onClose={() => setShowSignupModal(false)}>
            <div className="signup-offer" />
          </JoinUsModal>
        )}
      </div>
    </div>
  );
};

export default Directory;
