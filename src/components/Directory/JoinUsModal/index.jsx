import React, { useEffect, useState } from 'react';
import './JoinUsModal.scss';
import modalImage from '../../../assets/dragons-taipei101-view.png';
// import modalImage2 from '../../../assets/youtiao-sifu.png';
import fumartLogo from '../../../assets/fumart-text-logo-bombarda.png';
import fumartLogo2 from '../../../assets/fumart-text-logo-bombarda2.png';
import closeImage from '../../../assets/closeImage.png';

import { useTranslation } from 'react-i18next';

const JoinUsModal = ({ onClose, children }) => {
  const { t } = useTranslation(['home', 'common']);
  const [isClosing, setIsClosing] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 520);

  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email.');
      return;
    }

    console.log('Subscribed with:', email); // Replace with Firebase or API call
    alert('Thanks for subscribing!');
    setEmail('');
    handleClose();
  };


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 520);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleClose = () => {
    const now = Date.now();
    localStorage.setItem('joinUsLastShown', now.toString()); // ✅ Set timestamp only on close
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // match the closing animation
  };

  // useEffect(() => {
  //   const lastShown = localStorage.getItem('joinUsLastShown');
  //   const now = Date.now();
  //   const hours = 1;
  //   const oneDayInMs = hours * 60 * 60 * 1000;

  //   if (!lastShown || now - parseInt(lastShown, 10) > oneDayInMs) {
  //     localStorage.setItem('joinUsLastShown', now.toString());
  //     setIsClosing(false); // show modal
  //   } else {
  //     onClose(); // hide modal if already shown recently
  //   }
  // }, [onClose]);

  useEffect(() => {
    const lastShown = localStorage.getItem('joinUsLastShown');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const shouldShow = !lastShown || now - parseInt(lastShown, 10) > oneHour;

    if (shouldShow) {
      setIsClosing(false); // show modal
    }
  }, []);

  return (
    <div className="popup-modal-overlay" onClick={handleClose}>
      <div
        className={`popup-modal ${isClosing ? 'closing' : 'opening'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-close-button" onClick={handleClose}>
          <img src={closeImage}/>
        </div>
        <div className="popup-content">
          <div className="popup-wrap">
            <div className="left-image-wrap">
              <img src={modalImage} alt="promo" />
            </div>
            <div className="right-content-wrap">
              <div className="right-inner-wrap">
                <div className="logo-image-wrap">
                  <img src={isMobile ? fumartLogo2 : fumartLogo2} alt="promo" />
                </div>
                <div className="popup-heading">
                  {t('joinTitlePrefix') || 'Join Us for'}
                </div>
                <div className="popup-percent">
                  <>
                  </>
                  {t('joinTitlePercent') || '20% OFF'}
                </div>
                <p className="popup-text">
                  {t('joinDesc') ||
                    'Sign up to get 20% off your first order, early access to new products, and exclusive offers.'}
                </p>
                <p className="popup-text bot">
                  {t('joinDescB') || 'unsubscribe anytime'}
                </p>
                <div className="popup-input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder') || 'Email'}
                  /> 
                  <button onClick={handleSubscribe}>
                    {t('subscribe') || 'Subscribe'}
                  </button>
                  {/* <button onClick={handleSubscribe}>
                    {t('signIn') || ' signIn'}
                  </button>
                  <button onClick={handleSubscribe}>
                    {t('joinUs') || 'Join Us'}
                  </button> */}
                </div>
                <div className="popup-bottom-msg">
                  {t('joinNote') || ''}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinUsModal;
