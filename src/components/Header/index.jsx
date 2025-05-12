import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth, firestore } from '../../firebase/utils';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import fumartTextLogo from '../../assets/fumart-text-logo-bombarda.png';
// import bagIcon from '../../assets/bagIcon-filled2.png';
import bagIcon from '../../assets/bagIcon-tw.png';
import ShoppingBag from '../ShoppingBag';
import SearchBar from '../SearchBar';

import './Header.scss';

const Header = ({ title, subtitle, homepageHeader = false, comingSoonPage = false ,hasSearchBar = false}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 520);
  const [blink, setBlink] = useState(false);
  const { t } = useTranslation('header');

  const totalItemCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  
  useEffect(() => {
    setBlink(true);
  
    const timer = setTimeout(() => {
      setBlink(false);
    }, 500); // match your CSS animation duration
  
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
          const data = userDoc.data();
          setUserRole(data.role);
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
        {(hasSearchBar) && 
          <div className="cg-header-searchbar">
            <SearchBar />
          </div>
        }


        {homepageHeader && (
          <div className="cg-header-right">
            {!currentUser ? (
              <div className="header-auth-buttons">
                <button className="header-btn log-in" onClick={() => navigate('/login')}>
                  {t('login')}
                </button>
                <span className="separator">|</span>

                {/* {location.pathname === '/storefront' && isSmallScreen && (
                  <>
                    <button
                      className={`header-btn welcome-text ${scrolled ? 'scrolled' : ''}`}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      {t('welcome')}
                    </button>
                    <span className="separator">|</span>
                  </>
                )} */}

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
                <span className="user-name">
                  {currentUser.displayName || currentUser.email}
                </span>
                <div className="user-dropdown">
                  {userRole === 'admin' && (
                    <button className="header-btn admin-panel-btn" onClick={() => navigate('/admin')}>
                      {t('adminPanel') || 'Admin Panel'}
                    </button>
                  )}
                  <button className="header-btn log-out" onClick={handleLogout}>
                    {t('logout')}
                  </button>
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

      <ShoppingBag isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
    </>
  );
};

export default Header;
