import React, { useState } from 'react';
import fumartLogo from '../../assets/fumart-m-t-bg.png';
import './RecoverPassword.scss';
import { auth } from '../../firebase/utils';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const RecoverPassword = () => {
  const { t } = useTranslation(['account']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      alert(t('enterEmail'));
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`${t('resetLinkSent')} ${email}`);
      setEmail('');
      navigate('/login');
    } catch (error) {
      console.error('Error sending reset email:', error);
      if (error.code === 'auth/user-not-found') {
        alert(t('noAccount'));
      } else if (error.code === 'auth/invalid-email') {
        alert(t('invalidEmail'));
      } else {
        alert(t('resetFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
      <img
        src={fumartLogo}
        alt="Fü-Mart Logo"
        className="login-logo"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/')}
      />
        <div className="login-title">{t('resetTitle')}</div>
        <p className="login-subtitle">{t('resetSubtitle')}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? <div className="spinner"></div> : t('logIn')}
          </button>
        </form>
        <div className="login-links">
          <span>{t('rememberPassword')}</span>
          <a href="/login"> {t('logIn')}</a>
        </div>
      </div>
    </div>
  );
};

export default RecoverPassword;
