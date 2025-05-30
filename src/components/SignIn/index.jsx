import React, { useState, useEffect } from 'react';
import fumartLogo from '../../assets/fumart-m-red-bg.png';
import { auth } from '../../firebase/utils';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import cornerImg from '../../assets/corner-image.jpg';
import Header from '../Header';
import './SignIn.scss';

const SignIn = () => {
  const { t } = useTranslation(['account', 'common']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User already logged in:', user);
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert(t('fillFields'));
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      console.error('Error logging in:', error);
      if (error.code === 'auth/wrong-password') {
        alert(t('wrongPassword'));
      } else if (error.code === 'auth/user-not-found') {
        alert(t('noAccount'));
      } else {
        alert(t('loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header 
        comingSoonPage={true}
        hideMobileButtons = {true}
      />
      <div className="corner-decoration top-left">
          <img src={cornerImg} alt="Corner" />
      </div>
      <div className="corner-decoration top-right">
          <img src={cornerImg} alt="Corner" />
      </div>
      <div className="corner-decoration bottom-left">
          <img src={cornerImg} alt="Corner" />
      </div>
      <div className="corner-decoration bottom-right">
          <img src={cornerImg} alt="Corner" />
      </div>
      <div className="login-card">
        <div className="login-title">{t('loginTitle')}</div>
        <p className="login-subtitle">{t('loginSubtitle')}</p>
        <form onSubmit={handleSubmit}>
          <input
            className="account-input first"
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          <input
            className="account-input last"
            type="password"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <a className='fgpw' href="/forgot-password">
            {t('forgotPassword')}
          </a>
          <button type="submit" disabled={loading}>
            {loading ? <div className="spinner"></div> : t('logIn')}
          </button>
          
        </form>
        <div className="login-links">
          <div>{t('dontHaveAnAccount')}</div>
          <a href="/signup">{t('signUp')}</a>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
