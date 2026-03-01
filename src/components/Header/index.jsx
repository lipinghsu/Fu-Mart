import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth, firestore } from '../../firebase/utils';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

import fumartTextLogo from '../../assets/fumart-text-logo-bombarda.png';
import bagIcon from '../../assets/Icons/bagIcon-filled.png';
import AccountIcon from '../../assets/Icons/account-icon.png';
import DefaultAvatar from '../../assets/Icons/account-icon.png';
import SettingsIcon from '../../assets/Icons/settings-icon2.png';

import ShoppingBag from '../ShoppingBag';
import SideMenu from '../SideMenu';
import SearchBar from '../SearchBar';
import MobileButtons from '../MobileButtons';
import SettingsModal from './SettingsModal';

import './Header.scss';

const Header = ({
  subtitle,
  mainPageHeader = false,
  comingSoonPage = false,
  hasSearchBar = false,
  hideMobileButtons = false,
  isDarkMode,
  toggleDarkMode,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 520);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [blink, setBlink] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => localStorage.getItem('preferredCurrency') || 'USD'
  );

  const triggerRef = useRef();
  const [triggerWidth, setTriggerWidth] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('header');

  const totalItemCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  const toUsername = (src = '') =>
    src
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9._-]/g, '');

  const safeHandle = (user) =>
    username ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : '');

  // Language change
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('preferredLanguage', lang);
    window.location.reload();
  };

  // Detect clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-dropdown-wrapper')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Blink animation when cart updates
  useEffect(() => {
    setBlink(true);
    const timer = setTimeout(() => setBlink(false), 500);
    return () => clearTimeout(timer);
  }, [totalItemCount]);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 520);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Header scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Firebase user listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const snap = await getDoc(doc(firestore, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const u =
            data.username ??
            data.handle ??
            toUsername(user.displayName) ??
            toUsername(user.email?.split('@')[0]);
          setUsername(u || '');
          setAvatarUrl(data.avatar || user.photoURL || null);
        } else {
          const u =
            toUsername(user.displayName) ||
            toUsername(user.email?.split('@')[0]);
          setUsername(u || '');
          setAvatarUrl(user.photoURL || null);
        }
      } else {
        setUsername('');
        setAvatarUrl(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Track trigger width (for dropdown width match)
  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [i18n.language, showDropdown]);

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
        <div
          className={`cg-header-left ${comingSoonPage ? 'center-align' : ''}`}
        >
          <div
            className="logo-container"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <img src={fumartTextLogo} alt="Logo" />
          </div>
          {subtitle &&
            !(location.pathname === '/storefront' && isSmallScreen) && (
              <div className="cg-sub-title">{subtitle}</div>
            )}
        </div>

        {hasSearchBar && !isSmallScreen && (
          <div className="cg-header-searchbar">
            <SearchBar
              isExpanded={searchExpanded}
              setIsExpanded={setSearchExpanded}
            />
          </div>
        )}

        {mainPageHeader && (
          <div className="cg-header-right">
            <div
              className={`header-auth-buttons ${
                isSmallScreen ? 'hidden-mobile' : ''
              }`}
            >
              {/* Settings */}
              <div
                className="header-btn header-lang-button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSettingsOpen(true);
                }}
              >
                <div className={`bag-img-wrap non-avatar ${blink ? 'blinking' : ''}`}>
                  <img src={SettingsIcon} alt="Settings" />
                </div>
                <span className="btn-label">{t('settings.title')}</span>
              </div>

              <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
                i18n={i18n}
                handleLanguageChange={handleLanguageChange}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
              />

              {/* --- NOT LOGGED IN: hover dropdown --- */}
              {!currentUser ? (
                <div
                  className="user-dropdown-wrapper"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div
                    className="header-btn sign-up user-trigger"
                    ref={triggerRef}
                    onClick={() => navigate('/login')}
                  >
                    <div className="bag-img-wrap">
                      <img src={AccountIcon} alt="Account" />
                    </div>
                    <span className="btn-label">{t('login') || 'Sign In'}</span>
                  </div>

                  <div
                    className={`hover-dropdown ${showDropdown ? 'visible' : ''}`}
                    style={{ width: triggerWidth || 'auto' }}
                  >
                    <div className="dropdown-section">
                      <div className="dropdown-text">
                        <p>{t('newCustomer')}</p>
                        <p>
                          <span
                            className="link-text"
                            onClick={() => navigate('/signup')}
                          >
                            {t('startHere')}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // --- LOGGED IN: same hover behavior, different content ---
                <div
                  className="user-dropdown-wrapper"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div
                    className="header-btn sign-up user-trigger"
                    ref={triggerRef}
                  >
                    <div className="bag-img-wrap avatar logged-in">
                      <img src={avatarUrl || DefaultAvatar} alt="User Avatar" />
                    </div>
                    <span className="btn-label user-label">
                      {safeHandle(currentUser)}
                    </span>
                  </div>

                  <div
                    className={`user-dropdown ${showDropdown ? 'visible' : ''}`}
                    style={{ width: triggerWidth || 'auto' }}
                  >
                    <button
                      className="user-dropdown-btn"
                      onClick={() => {
                        if (username) {
                          setShowDropdown(false);
                          navigate(`/profile/${encodeURIComponent(username)}`);
                        } else {
                          navigate('/settings');
                        }
                      }}
                    >
                      {username ? `@${username}` : '@username'}
                    </button>
                    <button
                      className="user-dropdown-btn sell-now"
                      onClick={() => navigate('/admin')}
                    >
                      {t('sellNow') || 'Sell Now'}
                    </button>
                    <button
                      className="user-dropdown-btn"
                      onClick={() => navigate('/ComingSoon')}
                    >
                      {t('purchases') || 'Purchases'}
                    </button>
                    <button
                      className="user-dropdown-btn"
                      onClick={() => navigate('/ComingSoon')}
                    >
                      {t('help') || 'Help'}
                    </button>
                    <button
                      className="user-dropdown-btn log-out"
                      onClick={handleLogout}
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}

              {/* Cart */}
              <div
                className={`shopping-bag ${blink ? 'blinking' : ''}`}
                onClick={() => setIsCartOpen(!isCartOpen)}
              >
                <div className={`bag-img-wrap ${blink ? 'blinking' : ''}`}>
                  <img src={bagIcon} alt="Shopping Bag" />
                </div>
                <span
                  className={`bag-count ${totalItemCount > 0 ? 'active' : ''}`}
                >
                  {totalItemCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      <MobileButtons
        isSmallScreen={isSmallScreen}
        searchExpanded={searchExpanded}
        setSearchExpanded={setSearchExpanded}
        totalItemCount={totalItemCount}
        setIsCartOpen={setIsCartOpen}
        setIsSideMenuOpen={setIsSideMenuOpen}
        blink={blink}
        hideMobileButtons={hideMobileButtons}
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
