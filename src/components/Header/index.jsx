import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth, firestore } from '../../firebase/utils';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import fumartTextLogo from '../../assets/fumart-text-logo-bombarda.png';
import bagIcon from '../../assets/bagIcon-filled.png';



import ShoppingBag from '../ShoppingBag';
import SideMenu from '../SideMenu';
import SearchBar from '../SearchBar';
import MobileButtons from '../MobileButtons';
import CurrencySwitcher from './CurrencySwitcher';

import './Header.scss';

const Header = ({ title, subtitle, mainPageHeader = false, comingSoonPage = false ,hasSearchBar = false, hideMobileButtons  = false, isDarkMode, toggleDarkMode}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => setShowDropdown(prev => !prev);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 520);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [blink, setBlink] = useState(false);
  const { t } = useTranslation('header');
  const [selectedCurrency, setSelectedCurrency] = useState(() => localStorage.getItem('preferredCurrency') || 'USD');


  const totalItemCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  // close user-dropdown menu if user clicks outside of the div
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-dropdown-wrapper')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setBlink(true);
    const timer = setTimeout(() => setBlink(false), 500);
    return () => clearTimeout(timer);
  }, [totalItemCount]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 520);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <header className={`cg-header ${scrolled ? 'scrolled' : ''}`}>
        <div className={`cg-header-left ${comingSoonPage ? 'center-align' : ''}`}>
          <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={fumartTextLogo} alt="Logo" />
          </div>
          {subtitle && !(location.pathname === '/storefront' && isSmallScreen) && (
            <div className="cg-sub-title">{subtitle}</div>
          )}
        </div>

        {(hasSearchBar && !isSmallScreen) && (
          <div className="cg-header-searchbar">
            <SearchBar isExpanded={searchExpanded} setIsExpanded={setSearchExpanded} />
          </div>
        )}

        {mainPageHeader && (
          <div className="cg-header-right">
            {!currentUser ? (
              <div className={`header-auth-buttons ${isSmallScreen ? 'hidden-mobile' : ''}`}>
                <button className="header-btn log-in" onClick={() => navigate('/login')}>
                  {t('login')}
                </button>
                <span className="separator">|</span>
                <button className="header-btn sign-up" onClick={() => navigate('/signup')}>
                  {t('signup')}
                </button>
                <div
                  className={`shopping-bag ${blink ? 'blinking' : ''}`}
                  onClick={() => setIsCartOpen(!isCartOpen)}
                >
                  <div className={`bag-img-wrap ${blink ? 'blinking' : ''}`}>
                    <img src={bagIcon} alt="Shopping Bag" />
                  </div>
                  <span className={`bag-count ${totalItemCount > 0 ? 'active' : ''}`}>
                    {totalItemCount}
                  </span>
                </div>
              </div>
            ) : (
              <div className="user-menu">
                <div className="user-dropdown-wrapper">
                  <div className="user-name" onClick={toggleDropdown}>
                    {/* {currentUser.displayName || currentUser.email} */}
                    Account
                  </div>

                  {showDropdown && (
                    <div className="user-dropdown">
                      <button className="user-dropdown-btn" onClick={() => navigate('/ComingSoon')}>
                        {/* {t('myShop') || 'My Shop'} */}
                        @username
                      </button>
                      <button className="user-dropdown-btn" onClick={() => navigate('/admin')}>
                        {t('sellNow') || 'Sell Now'}
                      </button>
                      <button className="user-dropdown-btn" onClick={() => navigate('/ComingSoon')}>
                        {t('purchases') || 'Purchases'}
                      </button>
                      <button className="user-dropdown-btn" onClick={() => navigate('/ComingSoon')}>
                        {t('settings') || 'Settings'}
                      </button>
                      <button className="user-dropdown-btn" onClick={() => navigate('/ComingSoon')}>
                        {t('help') || 'Help'}
                      </button>
                      <CurrencySwitcher
                        selectedCurrency={selectedCurrency}
                        setSelectedCurrency={setSelectedCurrency}
                        t={t}
                      />
                      <button className="user-dropdown-btn log-out" onClick={handleLogout}>
                        {t('logout')}
                      </button>
                    </div>
                  )}
                </div>

                <div className={`shopping-bag ${blink ? 'blinking' : ''}`} onClick={() => setIsCartOpen(true)}>
                  <div className={`bag-img-wrap ${blink ? 'blinking' : ''}`}>
                    <img src={bagIcon} alt="Shopping Bag" />
                  </div>
                  <span className={`bag-count ${totalItemCount > 0 ? 'active' : ''}`}>
                    {totalItemCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 📱 Mobile buttons block */}
      <MobileButtons
        isSmallScreen={isSmallScreen}
        searchExpanded={searchExpanded}
        setSearchExpanded={setSearchExpanded}
        totalItemCount={totalItemCount}
        setIsCartOpen={setIsCartOpen}
        setIsSideMenuOpen={setIsSideMenuOpen}
        blink={blink}
        hideMobileButtons = {hideMobileButtons}
      />

      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        searchExpanded={searchExpanded}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <ShoppingBag isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
    </>
  );
};

export default Header;
