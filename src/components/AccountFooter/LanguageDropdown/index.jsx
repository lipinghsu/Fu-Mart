import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import './LanguageDropdown.scss';

const LanguageDropdown = ({ isOpen, setIsOpen, onClose, onSelect }) => {
  const dropdownRef = useRef(null);
  const [closing, setClosing] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setHasOpened(true);
    } else if (hasOpened) {
      setClosing(true);
      onClose();
      const timeout = setTimeout(() => setClosing(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, hasOpened]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) {
          setClosing(true);
          onClose();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen && !closing) return null;

  const currentLang = i18n.language;

  const languages = [
    { code: 'jp', label: '日本語' },
    { code: 'kr', label: '한국어' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'en', label: 'English' }
    
  ];

  return (
    <div
      ref={dropdownRef}
      className={`lang-dropdown ${isOpen ? 'opening' : ''} ${closing ? 'closing' : ''}`}
    >
      <div className="lang-dropdown-header">
        <span className="lang-dropdown-title">{t('language')}</span>
      </div>

      {languages.map((lang, idx) => (
        <div
          key={lang.code}
          className={`lang-dropdown-option ${idx === 0 ? 'first' : ''} ${currentLang === lang.code ? 'active' : ''}`}
          onClick={() => onSelect(lang.code)}
        >
          <>{lang.label}</>
        </div>
      ))}

      <div
        className="lang-dropdown-option close-btn"
        onClick={() => {
          setClosing(true);
          onClose();
        }}
      >
        {t('close')}
      </div>
    </div>
  );
};

export default LanguageDropdown;
