import React from 'react';
import { useTranslation } from 'react-i18next';
import './ConfirmDialog.scss';

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  const { t } = useTranslation(['common']);

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="dialog-buttons">
          <button className="cancel-btn" onClick={onCancel}>{t('cancel')}</button>
          <button className="confirm-btn" onClick={onConfirm}>{t('confirm')}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
