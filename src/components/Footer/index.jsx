import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import FeedbackModal from '../FeedbackModal';
import LanguageDropdown from './LanguageDropdown';
import SignupSection from './SignupSection';
// import { ThemeContext } from '../../context/ThemeContext';
import titleDecoration from './../../assets/title-dec2.jpeg';
import taipeiText from '../../assets/bsts.png';
import SettingsModal from '../Header/SettingsModal'; 
import './Footer.scss';

const Footer = ({ isDarkMode, toggleDarkMode, showFull = false }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { t } = useTranslation(['footer']);
  const location = useLocation();
  
    const [selectedCurrency, setSelectedCurrency] = useState(
    () => localStorage.getItem('preferredCurrency') || 'USD'
  );

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

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter a valid email.');
      return;
    }
    setIsSubmitting(true);
    try {
      await firestore.collection('newsletterSignups').add({ email, timestamp: new Date() });
      alert("You've been added to our newsletter list.");
      setEmail('');
    } catch (err) {
      console.error('Error signing up:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleDragStart = (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); };
    document.addEventListener('dragstart', handleDragStart);
    return () => document.removeEventListener('dragstart', handleDragStart);
  }, []);

  return (
    <>
      {showFull && (
        <>
          <SignupSection />
          <div className="title-dec-wrap">
            <img src={titleDecoration} alt="decoration" />
            <img src={titleDecoration} alt="decoration" />
            <img src={titleDecoration} alt="decoration" />
            <img src={titleDecoration} alt="decoration" className="bot" />
          </div>
        </>
      )}
      <footer className="cg-footer">

        <div className="cg-footer-left">
          <a
            className={`cg-store-link ${location.pathname === '/storefront' ? 'active' : ''}`}
            href="/storefront"
            onClick={(e) => {
              if (location.pathname === '/storefront') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            {location.pathname === '/storefront' ? t('welcome') : t('welcome')}
          </a>
          <div className="cg-disclaimer top">
            © 2025{' '}
            <a href="/" className="fu-mart-text">FÜ-MART</a> | {t('allRightsReserved')}
          </div>
          <div className="cg-disclaimer lang-selector-wrap">
            <Link to="/about">{t('aboutus')}</Link> |{' '}{' '}
            <Link to="/privacy">{t('privacy')}</Link> |{' '}
            <Link to="/terms">{t('terms')}</Link> |{' '}
            <a
              className="feedback-link"
              onClick={(e) => { e.preventDefault(); setIsFeedbackOpen(true); }}
            >
              {t('feedback')}
            </a>{' '}
            |{' '}
            <a
              className="dark-mode-toggle"
              onClick={(e) => {
                e.preventDefault();
                setIsSettingsOpen(true);
              }}
            >
              {t('settings')}
            </a>
          </div>
        </div>

        <div className="cg-footer-center">
          <a
            className="spotify-toggle-btn"
          >
            <img
              src={taipeiText}
              className={true ? 'taipei-text active' : 'taipei-text'}
              draggable={false}
            />
          </a>
        </div>

        <div className="cg-footer-right">
          <form className="cg-newsletter" onSubmit={handleNewsletterSubmit}>
            <input
              id="cg-email"
              type="email"
              className="cg-email-input"
              placeholder={t('emailPlaceholder')}
              required
              aria-label={t('emailAria')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <button className="cg-join-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('joining') : t('join')}
            </button>
          </form>
          <div className="cg-signup-disclaimer">{t('signupDisclaimer')}</div>
        </div>
      </footer>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
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
    </>
  );
};

export default Footer;