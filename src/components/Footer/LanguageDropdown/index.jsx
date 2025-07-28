import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import './LanguageDropdown.scss';

const LanguageDropdown = ({ isOpen, setIsOpen, onSelect }) => {
  const dropdownRef = useRef(null);
  const { t } = useTranslation('common');
  const currentLang = i18n.language;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const languages = [
    { code: 'jp',   label: '日本語' },
    { code: 'kr',   label: '한국어' },
    { code: 'zh-TW',label: '中文 (臺灣)' },
    { code: 'en',   label: 'English' },
  ];

  return (
    <div ref={dropdownRef} className={
            `lang-dropdown ${isOpen? 'opening' : ''}`}>
      <div className="lang-dropdown-header">
        <span className="lang-dropdown-title">{t('language')}</span>
      </div>

      {languages.map((lang, idx) => (
        <div
          key={lang.code}
          className={
            `lang-dropdown-option ${idx === 0 ? 'first' : ''}` +
            (currentLang === lang.code ? ' active' : '')
          }
          onClick={() => {
            onSelect(lang.code);
            setIsOpen(false);
          }}
        >
          {lang.label}
        </div>
      ))}

      <div
        className="lang-dropdown-option close-btn"
        onClick={() => setIsOpen(false)}
      >
        {t('close')}
      </div>
    </div>
  );
};

export default LanguageDropdown;
