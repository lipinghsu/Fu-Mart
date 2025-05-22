import React, { useState } from 'react';
import fumartLogo from '../../assets/fumart-m-t-bg.png';
import './SignUp.scss';
import { auth, firestore } from '../../firebase/utils';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SignUp = () => {
  const { t } = useTranslation(['account', 'common']);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t('passwordMismatch'));
      return;
    }
    if (!email || !name || !password) {
      alert(t('fillFields'));
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // set display name in Firebase Auth profile
      await updateProfile(user, { displayName: name });

      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        password: password, // !!! storing raw password !!!
        createdAt: new Date(),
        role: 'user' // or 'admin'
      });

      navigate('/');
    } catch (error) {
      console.error('Error signing up:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert(t('emailInUse'));
      } else if (error.code === 'auth/weak-password') {
        alert(t('weakPassword'));
      } else if (error.code === 'auth/invalid-email') {
        alert(t('invalidEmail'));
      } else {
        alert(`${t('signupFailed')}: ${error.message || t('tryAgain')}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-logo-wrap">
          <img
            src={fumartLogo}
            alt="Fü-Mart Logo"
            className="signup-logo"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
        </div>

        <div className="signup-title">{t('signupTitle')}</div>
        <p className="signup-subtitle">{t('signupSubtitle')}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="account-input first"
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="email"
            className="account-input mid A"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            className="account-input mid B"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            className="account-input last"
            placeholder={t('confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? <div className="spinner"></div> : t('signUp')}
          </button>
        </form>
        <div className="login-links">
          <div>{t('alreadyHaveAccount')}</div>
          <a href="/login"> {t('logIn')}</a>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
