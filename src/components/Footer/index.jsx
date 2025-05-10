import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import FeedbackModal from '../FeedbackModal';

const Footer = ({ isDarkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const langDropdownRef = useRef(null);
  const { t } = useTranslation(['home', 'common']);

  const languageLabels = {
    en: 'English',
    'zh-TW': '中文 [臺灣]',
    jp: '日本語',
    kr: '한국어',
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('preferredLanguage', lang);
    setIsLangDropdownOpen(false);
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter a valid email.');
      return;
    }
    setIsSubmitting(true);
    try {
      await firestore.collection('newsletterSignups').add({
        email: email,
        timestamp: new Date(),
      });
      alert("You've been added to our newsletter list.");
      setEmail('');
    } catch (err) {
      console.error('Error signing up:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <footer className="cg-footer">
        <div className="cg-footer-left">
        <a
  className="cg-store-link"
  href="/storefront"
  onClick={(e) => {
    if (location.pathname === '/storefront') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // else: let it navigate to /storefront
  }}
>
  {location.pathname === '/storefront' ? t('welcome') : t('store')}
</a>

          <div className="cg-disclaimer">
            © 2025{' '}
            <a href="/" className="fu-mart-text">
              FÜ-MART
            </a>{' '}
            | {t('allRightsReserved')}
          </div>
          <div className="cg-disclaimer lang-selector-wrap" ref={langDropdownRef}>
            <Link to="/terms">{t('terms')}</Link> |{' '}
            <Link to="/privacy">{t('privacy')}</Link> |{' '}
            <a className="feedback-link" onClick={(e) => {
              e.preventDefault();
              setIsFeedbackOpen(true);
            }}>
              {t('feedback')}
            </a>{' '}|{' '}
            <a className="lang-button" onClick={(e) => {
              e.preventDefault();
              setIsLangDropdownOpen(!isLangDropdownOpen);
            }}>
              {languageLabels[i18n.language] || languageLabels[0] || 'Language'}
            </a>{' '}|{' '}
            <a className="dark-mode-toggle" onClick={(e) => {
              e.preventDefault();
              toggleDarkMode();
            }}>
              {isDarkMode ? t('dark') : t('light')}
            </a>
            <div className={`lang-dropdown ${isLangDropdownOpen ? 'open' : ''}`}>
              <div onClick={() => handleLanguageChange('jp')}>日本語</div>
              <div onClick={() => handleLanguageChange('kr')}>한국어</div>
              <div onClick={() => handleLanguageChange('zh-TW')}>中文 [臺灣]</div>
              <div onClick={() => handleLanguageChange('en')}>English</div>
            </div>
          </div>
        </div>
        <div className="cg-footer-right">
          <form className="cg-newsletter" onSubmit={handleNewsletterSubmit}>
            <label htmlFor="cg-email" className="sr-only">
              {t('emailLabel')}
            </label>
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
      {isFeedbackOpen && <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />}
    </>
  );
};

export default Footer;
