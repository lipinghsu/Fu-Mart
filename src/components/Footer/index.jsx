import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import FeedbackModal from '../FeedbackModal';
import LanguageDropdown from './LanguageDropdown';
import './Footer.scss'

const Footer = ({ isDarkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { t } = useTranslation(['footer']);
  const location = useLocation();

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
          className={`cg-store-link ${location.pathname === '/storefront' ? 'active' : ''}`}
          href="/storefront"
          onClick={(e) => {
            if (location.pathname === '/storefront') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
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
          {/* {isFeedbackOpen ? "isFeedbackOpen" : "!isFeedbackOpen"} */}
          <div className="cg-disclaimer lang-selector-wrap">
            <Link to="/terms">{t('terms')}</Link> |{' '}
            <Link to="/privacy">{t('privacy')}</Link> |{' '}
            <a
              className="feedback-link"
              onClick={(e) => {
                e.preventDefault();
                setIsFeedbackOpen(true);
              }}
            >
              {t('feedback')}
            </a>{' '}
            |{' '}
            <a
              className="lang-button"
              onClick={(e) => {
                e.preventDefault();
                setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
              }}
            >
              {languageLabels[i18n.language] || 'Language'}
            </a>{' '}
            |{' '}
            <a
              className="dark-mode-toggle"
              onClick={(e) => {
                e.preventDefault();
                toggleDarkMode();
              }}
            >
              {isDarkMode ? t('dark') : t('light')}
            </a>

            <LanguageDropdown
              isOpen={isLanguageDropdownOpen}
              onClose={() => setIsLanguageDropdownOpen(false)}
              onSelect={(lang) => {
                handleLanguageChange(lang);
                setIsLanguageDropdownOpen(false); // optional: close after selection
              }}
            />
          </div>
          {/* lang-button always set it to open */}
          {/* {isLanguageDropdownOpen ? 'open' : "close"}  */}
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
      {/* {isFeedbackOpen ? "isFeedbackOpen" : "!isFeedbackOpen"} */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        
    </>
  );
};

export default Footer;
