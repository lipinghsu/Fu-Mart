import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Ticker.scss';

const Ticker = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['home']);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null; 

  return (
    <div className="ticker-frame">
      <span
        className="ticker-text"
        onClick={() => navigate('/signup')}
      >
        
        {t('joinLuckyDraw') || 'Join now for a free Lucky Draw and surprise gifts!'}
      </span>

      <button
        className="ticker-close-btn"
        aria-label="Close"
        onClick={() => setIsVisible(false)}
      >
        ✕
      </button>
    </div>
  );
};

export default Ticker;

