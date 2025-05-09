import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../../firebase/utils';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import fumartTextLogo from '../../assets/fumart-text-logo-bombarda.png';
import barIcon from '../../assets/bagIcon.png';
import './Header.scss';

const Header = ({ title, subtitle, homepageHeader = false, comingSoonPage = false }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { t } = useTranslation(['common']);

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
    <header className="cg-header">
      <div className={`cg-header-left ${comingSoonPage ? 'center-align' : ''}`}>
        <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={fumartTextLogo}/>
        </div>
        <div className="cg-sub-title">{subtitle}</div>
      </div>

      {homepageHeader && (
        <div className="cg-header-right">
          {!currentUser ? (
            <div className="header-auth-buttons">
              <button className="header-btn log-in" onClick={() => navigate('/login')}>
                {t('login')}
              </button>
              <span className="separator">|</span>
              <button className="header-btn sign-up" onClick={() => navigate('/signup')}>
                {t('signup')}
              </button>
              <div className="shopping-bag">
                <img src={barIcon}/>
              </div>
            </div>
          ) : (
            <div className="user-menu">
              <span className="user-name">
                {currentUser.displayName || currentUser.email}
              </span>
              <div className="user-dropdown">
                {userRole === 'admin' && (
                  <button
                    className="header-btn admin-panel-btn"
                    onClick={() => navigate('/admin')}
                  >
                    {t('adminPanel') || 'Admin Panel'}
                  </button>
                )}
                <button className="header-btn log-out" onClick={handleLogout}>
                  {t('logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
