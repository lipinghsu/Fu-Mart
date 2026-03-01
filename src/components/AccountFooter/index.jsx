import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import LanguageDropdown from './LanguageDropdown';
import './AccountFooter.scss'

const AccountFooter = ({ }) => {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const { t } = useTranslation(['footer']);

  const languageLabels = {
    en: 'English',
    'zh-TW': '繁體中文',
    jp: '日本語',
    kr: '한국어',
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('preferredLanguage', lang);
    setIsLanguageDropdownOpen(false);
    window.location.reload();
    
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    return savedTheme === 'dark';
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark-mode', newMode);
    localStorage.setItem('preferredTheme', newMode ? 'dark' : 'light');
  };
  useEffect(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    const isDark = savedTheme === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-info top">
          <a className="text">
            ©{' '}
          </a>
          {/* <a className="text"> */}
            {/* 2025{' '} */}
          {/* </a> */}
          
          <a href="/" className="brand-name">
            FÜ-MART
          </a>{' '}
          {' '}|{' '}

          {/* <Link to="/terms">{t('terms')}</Link> |{' '} */}
          {/* <Link to="/privacy">{t('privacy')}</Link> {' '}|{' '} */}
          {/* <a
            className="feedback-link"
            onClick={(e) => {
              e.preventDefault();
              setIsFeedbackOpen(true);
            }}
          >
            {t('feedback')}
          </a>{' '} */}
          
          <a
            className="dark-mode-toggle"
            onClick={(e) => {
              e.preventDefault();
              toggleDarkMode();
            }}
          >
            {isDarkMode ? t('dark') : t('light')}
          </a>

            {' '}|{' '}
          
          <a
            className="lang-button"
            onClick={(e) => {
              e.preventDefault();
              setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
            }}
          >
            {languageLabels[i18n.language] || 'Language'}
          </a>{' '}
          

          <LanguageDropdown
            isOpen={isLanguageDropdownOpen}
            onClose={() => setIsLanguageDropdownOpen(false)}
            onSelect={(lang) => {
              handleLanguageChange(lang);
              setIsLanguageDropdownOpen(false);
            }}
          />
        </div>

      </div>
    </footer>

  );
};

export default AccountFooter;
