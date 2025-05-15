import React, { useState, useRef, useEffect } from 'react';
import fumartLogo from './../../assets/fumart-t-bg.png';
import { useTranslation } from 'react-i18next';
import Header from './../Header';
import SearchBar from './../SearchBar';
import CgFooter from './../Footer';
import JoinUsModal from './JoinUsModal';
import ProductCard from './../ProductCard';
import topSectionImage from './../../assets/fu.png'
// import topSectionImage from './../../assets/fumart-m-red-bg.png'
import signUpImage from './../../assets/MingGuoPosters/signup-image.png'
import signUpImageB from './../../assets/MingGuoPosters/signup-image-1.png'
import './Directory.scss';
import LatestProducts from './LatestProducts'; 

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/utils';

let hasShownJoinModalThisSession = false;

const Directory = ({ showSignupDropdown, setShowSignupDropdown }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    return savedTheme === 'dark';
  });

  const { t } = useTranslation(['home', 'storefront']);
  const [rotation, setRotation] = useState(0);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [latestProducts, setLatestProducts] = useState([]);
  const suggestionsRef = useRef(null);

  const fetchLatestProducts = async () => {
    try {
      const q = query(
        collection(firestore, 'products'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      setLatestProducts(products);
    } catch (error) {
      console.error('Error fetching latest products:', error);
    }
  };


  useEffect(() => {
    fetchLatestProducts();

    const lastShown = localStorage.getItem('joinUsLastShown');
    const now = Date.now();
    const oneDay = 1000; // Adjust to 24hr for production

    if (!hasShownJoinModalThisSession && (!lastShown || now - parseInt(lastShown, 10) > oneDay)) {
      hasShownJoinModalThisSession = true;
      setTimeout(() => {
        setShowSignupModal(true);
      }, 4870);
    }
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const systemLang = navigator.language || navigator.userLanguage;

    if (!savedLanguage) {
      let langToSet = 'en';
      if (systemLang.startsWith('zh')) {
        langToSet = 'zh-TW';
      } else if (systemLang.startsWith('ja')) {
        langToSet = 'jp';
      } else if (systemLang.startsWith('ko')) {
        langToSet = 'kr';
      }
      document.documentElement.setAttribute('lang', langToSet);
      localStorage.setItem('preferredLanguage', langToSet);
    } else {
      document.documentElement.setAttribute('lang', savedLanguage);
    }

    const savedTheme = localStorage.getItem('preferredTheme');
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark-mode', prefersDark);
      localStorage.setItem('preferredTheme', prefersDark ? 'dark' : 'light');
    } else {
      const isDark = savedTheme === 'dark';
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle('dark-mode', isDark);
    }
  }, []);

  useEffect(() => {
    // Simulate fetching latest products from backend
    const mockData = [
      { id: '1', name: 'New Shirt', price: 25 },
      { id: '2', name: 'Cool Hat', price: 18 },
      { id: '3', name: 'Trendy Jacket', price: 60 },
    ];
    setLatestProducts(mockData);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark-mode', newMode);
    localStorage.setItem('preferredTheme', newMode ? 'dark' : 'light');
  };

  return (
    <div className="cg-root">
      <div className='directory'>
      <Header
        title={t('title')}
        homepageHeader={true}
        hasSearchBar={true}
      />
      <div className="cg-main">
        
        <div className='top-section'>
          {/* <div className='top-section-text-wrap'>
            歡迎光臨
          </div> */}
          <div className='top-section-img-wrap'>
            <img src={topSectionImage} />
          </div>
        </div>
        
        <LatestProducts />

        <div className="signup-section">
          <div className="signup-section-wrap">
            <div className="signup-left">
              <div className='signup-section-img-wrap'>
                <img src={signUpImageB} alt="Join Us" />
              </div>
            </div>
            <div className="signup-right">
              <div className='signup-title'>
                {t('home:signupTitle', 'Our goods? Not for just anyone')}
              </div>
              <div className='signup-text'>
                {t(
                  'home:signupDesc',
                  'Sign up now for early access to limited releases and exclusive member perks.'
                )}
              </div>
              <div className="signup-buttons">
                <button className="primary-btn">
                  {t('home:learnMore', 'Learn More').toUpperCase()}
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => window.location.href = '/signup'}
                >
                  {t('home:signupNow', 'Sign Up').toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
      <CgFooter isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      {showSignupModal && (
        <JoinUsModal onClose={() => setShowSignupModal(false)}>
          <div className="signup-offer"></div>
        </JoinUsModal>
      )}
      </div>
    </div>
  );
};

export default Directory;