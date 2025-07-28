import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import FeedbackModal from '../FeedbackModal';
import LanguageDropdown from './LanguageDropdown';
import SignupSection from './SignupSection';
import titleDecoration from './../../assets/title-dec2.jpeg';
import taipeiText from '../../assets/taipei-text.png';
import { useSpotify } from '../../context/SpotifyContext';
import './Footer.scss';

const Footer = ({ isDarkMode, toggleDarkMode, showFull = false }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { t } = useTranslation(['footer']);
  const location = useLocation();

  // Obtain shared Spotify state and controls
  const { isSpotifyOpen, toggleSpotifyOpen, isPlaying } = useSpotify();
  const languageLabels = {
    en: 'English',
    'zh-TW': '中文 (臺灣)',
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
        <div className={`spotify-player-container ${isSpotifyOpen ? 'active' : ''}`}>
          <div className="close-spotify-btn" aria-label="Close player" onClick={toggleSpotifyOpen} />
          <div className="spotify-player-wrap">
            <div id="spotify-embed" />
          </div>
        </div>

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
          <div className="cg-disclaimer top">
            © 2025{' '}
            <a href="/" className="fu-mart-text">FÜ-MART</a> | {t('allRightsReserved')}
          </div>
          <div className="cg-disclaimer lang-selector-wrap">
            <Link to="/terms">{t('terms')}</Link> |{' '}
            <Link to="/privacy">{t('privacy')}</Link> |{' '}
            <a
              className="feedback-link"
              onClick={(e) => { e.preventDefault(); setIsFeedbackOpen(true); }}
            >
              {t('feedback')}
            </a>{' '}|{' '}
            <a
              className="lang-button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                setIsLanguageDropdownOpen(prev => !prev);
              }}
            >
              {languageLabels[i18n.language] || 'Language'}
            </a>{' '}|{' '}
            <a
              className="dark-mode-toggle"
              onClick={(e) => { e.preventDefault(); toggleDarkMode(); }}
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

        <div className="cg-footer-center">
          <a
            className="spotify-toggle-btn"
            onClick={(e) => { e.preventDefault(); toggleSpotifyOpen(); }}
          >
            <img
              src={taipeiText}
              alt={isPlaying ? 'Pause music' : 'Play music'}
              className={isPlaying ? 'taipei-text active' : 'taipei-text'}
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
    </>
  );
};

export default Footer;
