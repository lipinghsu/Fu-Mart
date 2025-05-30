import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './ConfirmDialog.scss';

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  const { t } = useTranslation(['common']);
  const dialogRef = useRef();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        onCancel();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        onConfirm();
      } else if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onConfirm, onCancel]);

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog" ref={dialogRef}>
        <p>{message}</p>
        <div className="dialog-buttons">
          <button className="cancel-btn" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
