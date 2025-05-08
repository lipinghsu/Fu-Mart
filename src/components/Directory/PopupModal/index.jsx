import React from 'react';
import './PopupModal.scss';
import modalImage from '../../../assets/youtiao-sifu.png'
import { useTranslation } from 'react-i18next';

const PopupModal = ({ onClose, children, setShowSignupModa }) => {
  const { t } = useTranslation(['home', 'common']);
  return (
    <div className="popup-modal-overlay" onClick={onClose}>
      <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
        {/* <button className="popup-close-button" onClick={onClose}>✕</button> */}
        <div className="popup-content">
          <div className="popup-wrap">
            <div className="left-image-wrap">
                <img src={modalImage}/>
            </div>
            <div className="right-content-wrap">

            </div>
          </div>
        {/* <h2>{t('welcome')}</h2> */}
            {/* <p>Sign up now and get <strong>20% off</strong> your first 5 orders!</p> */}
            {/* <button onClick={() => setShowSignupModal(false)}>Sign Up Now</button> */}
        </div>
      </div>
    </div>
  );
};

export default PopupModal;
