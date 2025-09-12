import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import closeImage from './../../assets/Icons/closeImage.png';
import fumartTextLogo from './../../assets/fumart-text-logo-bombarda.png';
import LanguageDropdown from '../Footer/LanguageDropdown';
import './SideMenu.scss';

const languageLabels = {
  en: 'English',
  'zh-TW': '中文 (臺灣)',
  jp: '日本語',
  kr: '한국어',
};

const SideMenu = ({ isOpen, onClose, searchExpanded, isDarkMode, toggleDarkMode }) => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const [drawerState, setDrawerState] = useState('closed');
  const [scrolled, setScrolled] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

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

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('preferredLanguage', lang);
    setIsLanguageDropdownOpen(false);
    window.location.reload();
  };

  return (
    <>
      <div className={`side-menu-drawer ${drawerState}`}>  
        <div className={`side-menu-header ${scrolled ? 'scrolled' : ''}`}>
          <h2>
            <div className='side-menu-logo-wrap'>
              <img src={fumartTextLogo} alt="Logo" />
            </div>
          </h2>
          <div className="close-btn" onClick={onClose}>
            <img src={closeImage} alt={t('close')} />
          </div>
        </div>

        <div className="side-menu-body">
          <button className="side-menu-btn log-in" onClick={() => { navigate('/login'); onClose(); }}>
            <span>
              {t('login')}
            </span>
            
          </button>
          <button className="side-menu-btn sign-up" onClick={() => { navigate('/signup'); onClose(); }}>
            <span>
              {t('signup')}
            </span>
            
          </button>
          <button className="side-menu-btn about-us" onClick={() => { navigate('/about'); onClose(); }}>
            <span>
              {t('aboutus')}
            </span>
            
          </button>
        </div>

        <div className="side-menu-bot">
          {/* <div className='bot-img-wrap'>
            <img src={fumartLogo}/>
          </div> */}
          
        </div>
        <div className='side-menu-footer'>
          {/* <div>
             福罵集團
          </div> */}
          <a
            href='/'
            className='lang-button'
            onClick={(e) => {
              e.preventDefault();
              setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
            }}
          >
            {languageLabels[i18n.language] || t('language')}
          </a>
          


          <a
            href='/'
            className='dark-mode-toggle'
            onClick={(e) => {
              e.preventDefault();
              toggleDarkMode();
            }}
          >
            {isDarkMode ? t('dark') : t('light')}
          </a>
          
          <LanguageDropdown
            isOpen={isLanguageDropdownOpen}
            setIsOpen={setIsLanguageDropdownOpen}
            onSelect={handleLanguageChange}
          />
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
