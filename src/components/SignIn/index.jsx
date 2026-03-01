import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../../firebase/utils';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, query, collection, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import cornerImg from '../../assets/corner-image.jpg';
import fumartTextLogo from '../../assets/fumart-text-logo-bombarda.png';
import lineIcon from '../../assets/Icons/line-icon.png';
import kaKaoIcon from '../../assets/Icons/kakao-icon.png';
import naverIcon from '../../assets/Icons/naver-icon.png';
import Header from '../Header';
import './SignIn.scss';

const SignIn = () => {
  const { t } = useTranslation(['account', 'common']);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if user already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Handle login with email, username, or phone
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      alert(t('fillFields'));
      return;
    }
    setLoading(true);

    let userEmail = '';

    try {
      // Check if identifier is an email
      if (identifier.includes('@')) {
        userEmail = identifier;
      } else {
        // Assume it's a username or phone number and query Firestore
        const isPhoneNumber = /^\+[1-9]\d{1,14}$/.test(identifier);
        const fieldToQuery = isPhoneNumber ? 'phone' : 'username';
        
        const q = query(collection(firestore, 'users'), where(fieldToQuery, '==', identifier));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Found user, get their email
          const userData = querySnapshot.docs[0].data();
          userEmail = userData.email;
        } else {
          // No user found with that username or phone
          alert(t('noAccount'));
          setLoading(false);
          return;
        }
      }

      // Proceed with sign-in using the found email
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      const user = userCredential.user;

      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, { loginCount: increment(1) });
      } else {
        // This case is unlikely if they were found in the query above, but as a fallback:
        await setDoc(userRef, {
          email: user.email,
          loginCount: 1,
          createdAt: new Date(),
        });
      }

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

// ==================== LINE Login (登入) ====================
const handleLoginWithLINE = () => {
  console.log('✅ LINE 登入按鈕被點擊');

  const LINE_CHANNEL_ID = '2009268985';  

  const redirectUri = encodeURIComponent(
    window.location.origin + '/auth/line/callback'
  );

  const state = 'fumart_login_' + Date.now();

  const loginUrl = 
    `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code&` +
    `client_id=${LINE_CHANNEL_ID}&` +
    `redirect_uri=${redirectUri}&` +
    `state=${state}&` +
    `scope=openid%20profile%20email`;

  window.location.href = loginUrl;
};

// ==================== Kakao Login (登入) ====================
const handleLoginWithKakao = () => {
  console.log('✅ Kakao 登入按鈕被點擊');

  const KAKAO_CLIENT_ID = '75b6a6ff4c530399500e655d4e6e4e1f'; // Your REST/JS Key
  const redirectUri = encodeURIComponent(
    window.location.origin + '/auth/kakao/callback'
  );

  const state = 'fumart_login_' + Date.now();

  // Construct the URL manually to avoid SDK overhead
  const loginUrl = 
    `https://kauth.kakao.com/oauth/authorize?` +
    `response_type=code&` +
    `client_id=${KAKAO_CLIENT_ID}&` +
    `redirect_uri=${redirectUri}&` +
    `state=${state}&` +
    `scope=profile_nickname%20profile_image&` +
    `prompt=login`; // Force login prompt to ensure we get a fresh code

  window.location.href = loginUrl;
};
  return (
    <div className="login-page">
      
      {/* <Header comingSoonPage={true} hideMobileButtons={true} /> */}
      <div
        className="logo-container"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        <img src={fumartTextLogo} alt="Logo" />
      </div>
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
      <div className="login-content">
        <div className="login-card">
          <div className="login-title">{t('loginTitle')}</div>
          <p className="login-subtitle">{t('loginSubtitle')}</p>

          <form onSubmit={handleSubmit}>
            <input
              className="account-input first"
              type="text"
              placeholder={t('emailOrUsernamePlaceholder')}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
            <a className="fgpw" href="/forgot-password">
              {t('forgotPassword')}
            </a>
            <button type="submit" disabled={loading}>
              {loading ? <div className="spinner"></div> : t('logIn')}
            </button>
          </form>

          <div className='social-login'>
            <div className="or-divider">
              <span>{t('OR')}</span>
            </div>
            <div className='social-login-btn-wrapper'>
            <button 
              type="button" 
              className='social-login-btn line' 
              onClick={handleLoginWithLINE} 
              disabled={loading}
            >
              <img src={lineIcon} alt="LINE" />
              <div className='text-wrap'>
                {t('Log in with LINE')}
              </div>
            </button>

              <button 
                type="button" 
                className='social-login-btn kakao' 
                onClick={handleLoginWithKakao}
                disabled={loading}
              >
                <img src={kaKaoIcon} alt="Kakao" />
                <div className='text-wrap'>
                  {t('Log in with Kakao')}
                </div>
              </button>
            </div>
          </div>



          <div className="login-links">
            <div>{t('dontHaveAnAccount')}</div>
            <a href="/signup">{t('signUp')}</a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignIn;
