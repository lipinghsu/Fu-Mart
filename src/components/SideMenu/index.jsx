import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import closeImage from './../../assets/closeImage.png';
import './SideMenu.scss';

const SideMenu = ({ isOpen, onClose, searchExpanded }) => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const [drawerState, setDrawerState] = useState('closed');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDrawerState('opening');
    } else if (drawerState === 'opening') {
      setDrawerState('closing');
      setTimeout(() => setDrawerState('closed'), 600);
    }
  }, [isOpen]);

  return (
    <>
      <div className={`side-menu-drawer ${drawerState}`}>
        <div className={`side-menu-header ${scrolled ? 'scrolled' : ''}`}>
          <h2>{t('menu')}</h2>
          <div className="close-btn" onClick={onClose}>
            <img src={closeImage} alt={t('close')} />
          </div>
        </div>

        <div className="side-menu-body">
          <button className="header-btn log-in" onClick={() => { navigate('/login'); onClose(); }}>
            {t('login')}
          </button>
          <span className="separator">|</span>
          <button className="header-btn sign-up" onClick={() => { navigate('/signup'); onClose(); }}>
            {t('signup')}
          </button>
        </div>
      </div>

      <div
        className={`cart-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
    </>
  );
};

export default SideMenu;
