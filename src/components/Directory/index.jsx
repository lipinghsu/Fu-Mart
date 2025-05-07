import React, { useState, useRef, useEffect } from 'react';
import fumartLogo from './../../assets/fumart-t-bg.png';
import { useTranslation } from 'react-i18next';
import Header from './../Header';
import SearchBar from './../SearchBar';
import CgFooter from './../Footer'; 

const Directory = ({ showSignupDropdown, setShowSignupDropdown }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    return savedTheme === 'dark';
  });
  const { t } = useTranslation(['home', 'common']);
  const [rotation, setRotation] = useState(0);

  // Detect dark mode + language (same as before)
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
    const interval = setInterval(() => {
      setRotation((prev) => prev + 540);
    }, 38000);
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark-mode', newMode);
    localStorage.setItem('preferredTheme', newMode ? 'dark' : 'light');
  };

  return (
    <div className="cg-root">
      <Header 
        title={t('title')} 
        homepageHeader={true}
      />
      <main className="cg-main">
        <div
          className="logo-container"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <img src={fumartLogo} alt="Fü-Mart Logo" />
        </div>
        <SearchBar
          placeholder="Search for products..."
          onSearch={(query) => {
            console.log('Searching for:', query);
          }}
        />
      </main>
      <CgFooter isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  );
};

export default Directory;
