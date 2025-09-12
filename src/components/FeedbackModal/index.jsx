import React, { useState, useEffect, useRef } from 'react';
import './FeedbackModal.scss';
import fumartLogo from './../../assets/fumart-m-red-bg.png';
import closeImage from './../../assets/Icons/closeImage.png';
import { firestore } from '../../firebase/utils';
import { useTranslation } from 'react-i18next';

const FeedbackModal = ({ onClose, isOpen }) => {
  const [message, setMessage] = useState('');
  const [animateClass, setAnimateClass] = useState('closing');
  const overlayRef = useRef(null);
  const textareaRef = useRef(null); 
  const { t } = useTranslation(['footer']);
useEffect(() => {
  if (isOpen) {
    setAnimateClass('opening');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  } else {
    setAnimateClass('closing');
  }
}, [isOpen]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (overlayRef.current && event.target === overlayRef.current) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please enter your feedback.');
      return;
    }

    const feedbackData = {
      message: message.trim(),
      timestamp: new Date(),
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        referrer: document.referrer,
      },
    };

    try {
      await firestore.collection('feedback').add(feedbackData);
      alert('Thank you for your feedback!');
      setMessage('');
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div ref={overlayRef} className={`feedback-modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className={`feedback-modal ${animateClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="feedback-form-row">
          <form onSubmit={handleSubmit} className="feedback-form">
            <textarea
              ref={textareaRef} // 👈 Ref attached
              style={{ fontFamily: 'inherit' }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('feedback')}
              rows="1"
              required
              className="feedback-textarea"
            />
            <button type="submit" className="submit-btn">
              <img src={fumartLogo} alt="submit" />
            </button>
          </form>
          <button type="button" className="cancel-btn" onClick={onClose}>
            <img src={closeImage} alt="close" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
