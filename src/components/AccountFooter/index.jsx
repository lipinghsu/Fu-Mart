import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import FeedbackModal from '../FeedbackModal';
import LanguageDropdown from './LanguageDropdown';
import './AccountFooter.scss'

const AccountFooter = ({ isDarkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { t } = useTranslation(['footer']);
  const location = useLocation();

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

          <Link to="/terms">{t('terms')}</Link> |{' '}
          <Link to="/privacy">{t('privacy')}</Link> {' '}|{' '}
          {/* <a
            className="feedback-link"
            onClick={(e) => {
              e.preventDefault();
              setIsFeedbackOpen(true);
            }}
          >
            {t('feedback')}
          </a>{' '} */}
          
          {/* <a
            className="dark-mode-toggle"
            onClick={(e) => {
              e.preventDefault();
              toggleDarkMode();
            }}
          >
            {isDarkMode ? t('dark') : t('light')}
          </a>

            {' '}|{' '} */}
          
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
