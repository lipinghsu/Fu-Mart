import React from 'react';
import CurrencySwitcher from '../CurrencySwitcher';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './SettingsModal.scss';
import arrowIcon from '../../../assets/Icons/arrowIcon.png';

const SettingsModal = ({
  isOpen,
  onClose,
  i18n,
  handleLanguageChange,
  selectedCurrency,
  setSelectedCurrency,
  isDarkMode,          
  toggleDarkMode       
}) => {
  const { t } = useTranslation('header');

  if (!isOpen) return null;

  return (
    <div
      className={`settings-modal-overlay ${isOpen ? 'fade-in' : 'fade-out'}`}
      onClick={onClose}
    >
      <div
        className={`settings-modal ${isOpen ? 'fade-in' : 'fade-out'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{t('settings.title')}</h3>

        {/* Dark Mode Toggle — same logic as Footer */}
        <div className="settings-section">
          <label>{isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}</label>
          <div className="toggle-switch" onClick={toggleDarkMode}>
            <div className={`toggle-track ${isDarkMode ? 'dark' : 'light'}`}>
              <div className="toggle-icon sun"><FaSun /></div>
              <div className="toggle-icon moon"><FaMoon /></div>
              <div className={`toggle-thumb ${isDarkMode ? 'dark' : 'light'}`}></div>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="settings-section">
          <label htmlFor="lang">{t('settings.language')}</label>
          <div className="select-wrapper">
            <select
              id="lang"
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">{t('language.english')}</option>
              <option value="zh-TW">{t('language.chinese')}</option>
              <option value="jp">{t('language.japanese')}</option>
              <option value="kr">{t('language.korean')}</option>
            </select>
            <img src={arrowIcon} alt="arrow" className="arrow-icon" />
          </div>
        </div>

        {/* Currency Selector */}
        <div className="settings-section">
          <label>{t('settings.currency')}</label>
          <CurrencySwitcher
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
          />
        </div>

        <button className="close-btn" onClick={onClose}>
          {t('settings.close')}
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
