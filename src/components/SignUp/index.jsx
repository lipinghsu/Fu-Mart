import React, { useState, useEffect } from 'react';
import './SignUp.scss';
import { auth, firestore } from '../../firebase/utils';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../Header';
import cornerImg from '../../assets/corner-image.jpg';
import fumartTextLogo from '../../assets/fumart-text-logo-bombarda.png';
import lineIcon from '../../assets/Icons/line-icon.png';
import kaKaoIcon from '../../assets/Icons/kakao-icon.png';

const COUNTRY_OPTIONS = [
  // 🌎 North America
  { code: '+1', label: '🇺🇸 +1 (US)', country: 'United States', key: 'us' },
  { code: '+1', label: '🇨🇦 +1 (CA)', country: 'Canada', key: 'ca' },
  { code: '+52', label: '🇲🇽 +52 (MX)', country: 'Mexico' },
  // 🌏 Asia
  { code: '+81', label: '🇯🇵 +81 (JP)', country: 'Japan' },
  { code: '+82', label: '🇰🇷 +82 (KR)', country: 'South Korea' },
  { code: '+86', label: '🇨🇳 +86 (CN)', country: 'China' },
  { code: '+852', label: '🇭🇰 +852 (HK)', country: 'Hong Kong' },
  { code: '+853', label: '🇲🇴 +853 (MO)', country: 'Macau' },
  { code: '+886', label: '🇹🇼 +886 (TW)', country: 'Taiwan' },
  
  // 🌍 Europe
  { code: '+31', label: '🇳🇱 +31 (NL)', country: 'Netherlands' },
  { code: '+33', label: '🇫🇷 +33 (FR)', country: 'France' },
  { code: '+34', label: '🇪🇸 +34 (ES)', country: 'Spain' },
  { code: '+39', label: '🇮🇹 +39 (IT)', country: 'Italy' },
  { code: '+44', label: '🇬🇧 +44 (UK)', country: 'United Kingdom' },
  { code: '+49', label: '🇩🇪 +49 (DE)', country: 'Germany' },

    // 🌎 Latin America
  { code: '+51', label: '🇵🇪 +51 (PE)', country: 'Peru' },
  { code: '+54', label: '🇦🇷 +54 (AR)', country: 'Argentina' },
  { code: '+55', label: '🇧🇷 +55 (BR)', country: 'Brazil' },
  { code: '+56', label: '🇨🇱 +56 (CL)', country: 'Chile' },
  { code: '+57', label: '🇨🇴 +57 (CO)', country: 'Colombia' },

  // 🌏 Southeast Asia
  { code: '+60', label: '🇲🇾 +60 (MY)', country: 'Malaysia' },
  { code: '+62', label: '🇮🇩 +62 (ID)', country: 'Indonesia' },
  { code: '+63', label: '🇵🇭 +63 (PH)', country: 'Philippines' },
  { code: '+65', label: '🇸🇬 +65 (SG)', country: 'Singapore' },
  { code: '+66', label: '🇹🇭 +66 (TH)', country: 'Thailand' },
  { code: '+84', label: '🇻🇳 +84 (VN)', country: 'Vietnam' },
  { code: '+91', label: '🇮🇳 +91 (IN)', country: 'India' },

  // 🌏 Oceania
  { code: '+61', label: '🇦🇺 +61 (AU)', country: 'Australia' },
  { code: '+64', label: '🇳🇿 +64 (NZ)', country: 'New Zealand' },
];

const SignUp = () => {
  const { t } = useTranslation(['account', 'common']);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [useEmail, setUseEmail] = useState(false);

  const [countryCode, setCountryCode] = useState('+1');
  const [localNumber, setLocalNumber] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState({ month: '', day: '', year: '' });

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ==================== Kakao SDK 初始化 ====================
  useEffect(() => {
    const loadKakaoSDK = () => {
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init('75b6a6ff4c530399500e655d4e6e4e1f'); // ← 你的真實 Key
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
      script.async = true;
      script.onload = () => {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init('75b6a6ff4c530399500e655d4e6e4e1f');
        }
      };
      document.body.appendChild(script);
    };

    loadKakaoSDK();
  }, []);

  // ==================== Kakao 註冊 ====================
  const handleSignUpWithKakao = () => {
    if (!window.Kakao) {
      alert('Kakao SDK 尚未載入，請重新整理頁面後再試');
      return;
    }

    window.Kakao.Auth.authorize({
      redirectUri: 'http://localhost:5173/auth/kakao/callback',
      scope: 'profile_nickname, profile_image',   // ← 移除 email
      state: 'fumart_signup_' + Date.now(),
    });
  };
  
  // ==================== LINE 登入 ====================
  const handleSignUpWithLINE = () => {
    const clientID = '2009268985';
    // Use window.location.origin to support both localhost and fu-mart.com
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/line/callback`);
    const state = 'fumart_signup_' + Date.now();
    const scope = 'profile%20openid%20email';

    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientID}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
  };

  // ==================== 以下為你原本的程式碼（完全不變） ====================
  if (import.meta.env.DEV && auth?.app) {
    try {
      auth.app._isMockEnvironment = true;
      console.log('Running in local test mode (mock auth)');
    } catch {}
  }

  useEffect(() => {
    if (step === 2 && !useEmail) {
      setTimeout(() => {
        setupRecaptcha();
      }, 500);
    }
  }, [step, useEmail]);

  const getE164Phone = () => {
    const digits = (localNumber || '').replace(/[^\d]/g, '');
    return `${countryCode}${digits}`;
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!name || !dob.month || !dob.day || !dob.year) {
      alert(t('fillAllFields') || 'Please fill all fields.');
      return;
    }

    try {
      if (useEmail) {
        if (!emailInput) {
          alert(t('enterEmail') || 'Please enter your email.');
          return;
        }
        const q = query(collection(firestore, 'users'), where('email', '==', emailInput));
        const existing = await getDocs(q);
        if (!existing.empty) {
          alert(t('emailExists') || 'This email is already registered.');
          return;
        }
        setStep(3);
      } else {
        if (!localNumber) {
          alert(t('enterPhone') || 'Please enter your phone number.');
          return;
        }
        const phoneE164 = getE164Phone();
        const q = query(collection(firestore, 'users'), where('phone', '==', phoneE164));
        const existing = await getDocs(q);
        if (!existing.empty) {
          alert(t('phoneExists') || 'This phone number is already registered.');
          return;
        }
        setStep(2);
      }
    } catch (error) {
      console.error('Error checking uniqueness:', error);
      alert(t('verificationFailed') || 'Verification failed. Please try again.');
    }
  };

  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) return;
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    } catch (err) {
      console.error('Error initializing reCAPTCHA:', err);
    }
  };

  const sendOTP = async () => {
    setLoading(true);
    try {
      const phoneE164 = getE164Phone();
      const confirmationResult = await signInWithPhoneNumber(auth, phoneE164, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      alert(t('verificationSent') || 'Verification code sent!');
    } catch (error) {
      alert(t('failedToSendCode', { message: error.message }) || `Failed to send code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      localStorage.setItem('verifiedPhone', result.user.phoneNumber);
      await auth.signOut();
      setOtpVerified(true);
      alert(t('phoneVerifiedSuccess') || 'Phone verified successfully! Please complete the final step.');
      setStep(3);
    } catch (error) {
      alert(t('invalidCode') || 'Invalid code, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const finalEmail = useEmail ? emailInput : email;

    if (!finalEmail || !username || !password || !confirmPassword || password !== confirmPassword) {
      alert(password !== confirmPassword ? (t('passwordsMismatch') || 'Passwords do not match.') : (t('fillAllFields') || 'Please fill all fields.'));
      setLoading(false);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, finalEmail, password);
      const user = userCred.user;
      await updateProfile(user, { displayName: name });
      await sendEmailVerification(user);

      const phoneE164 = useEmail ? null : localStorage.getItem('verifiedPhone');
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        name,
        username,
        email: finalEmail,
        phone: phoneE164,
        dob: `${dob.year}-${dob.month}-${dob.day}`,
        verifiedPhone: !useEmail,
        verifiedEmail: false,
        loginCount: 1,
        createdAt: new Date(),
        role: 'user',
      });

      if (!useEmail) localStorage.removeItem('verifiedPhone');
      await auth.signOut();
      alert(t('accountCreated') || 'Account created! Please check your inbox and click the verification link before logging in.');
      navigate('/login');
    } catch (error) {
      alert(error.code === 'auth/email-already-in-use'
        ? t('emailExists') || 'This email is already registered.'
        : `${t('signupFailed') || 'Sign-up failed:'} ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div
        className="logo-container"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        <img src={fumartTextLogo} alt="Logo" />
      </div>
      <div className="corner-decoration top-left"><img src={cornerImg} alt="Corner" /></div>
      <div className="corner-decoration top-right"><img src={cornerImg} alt="Corner" /></div>
      <div className="corner-decoration bottom-left"><img src={cornerImg} alt="Corner" /></div>
      <div className="corner-decoration bottom-right"><img src={cornerImg} alt="Corner" /></div>

      <div className="signup-card">
        <div className="signup-title">{t('signupTitle') || 'Create Your Account'}</div>
        <p className="signup-subtitle">{t('signupSubtitle')}</p>

        {step === 1 && (
          <form onSubmit={handleStep1} className="signup-step1">
            <input type="text" className="account-input first" placeholder={t('namePlaceholder') || 'Name'} value={name} onChange={(e) => setName(e.target.value)} required />
            
            {!useEmail ? (
              <div className="phone-row">
                <div className="phone-inline">
                  <div className="country-select-wrapper">
                    <div className="country-display">{countryCode}</div>
                    <select className="account-input country-code real-select" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required>
                      {COUNTRY_OPTIONS.map(opt => <option key={opt.key || opt.country} value={opt.code}>{opt.label}</option>)}
                    </select>
                  </div>
                  <input type="tel" className="account-input phone-number" placeholder={t('phonePlaceholder') || 'Phone number'} value={localNumber} onChange={(e) => setLocalNumber(e.target.value)} required />
                </div>
                <a className="use-email-link" href="#" onClick={(e) => { e.preventDefault(); setUseEmail(true); }}>{t('useEmailInstead') || 'Use email instead'}</a>
              </div>
            ) : (
              <div className="email-row">
                <input type="email" className="account-input last email-input" placeholder={t('emailPlaceholder') || 'Email address'} value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required />
                <a className="use-email-link" href="#" onClick={(e) => { e.preventDefault(); setUseEmail(false); }}>{t('usePhoneInstead') || 'Use phone instead'}</a>
              </div>
            )}

            <div className="dob-section">
              <div className="dob-selects">
                <select className="dob-select" value={dob.month} onChange={(e) => setDob({ ...dob, month: e.target.value })} required>
                  <option value="">{t('month') || 'Month'}</option>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=>(
                    <option key={i} value={i+1}>{t(`months.${m.toLowerCase()}`) || m}</option>
                  ))}
                </select>
                <select className="dob-select" value={dob.day} onChange={(e) => setDob({ ...dob, day: e.target.value })} required>
                  <option value="">{t('day') || 'Day'}</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="dob-select" value={dob.year} onChange={(e) => setDob({ ...dob, year: e.target.value })} required>
                  <option value="">{t('year') || 'Year'}</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <span className="confirm-age-text">{t('confirmAgeText') || 'Please confirm your age. This won’t be public.'}</span>
            </div>

            <button type="submit" disabled={loading}>{t('continue') || 'Continue'}</button>

            <div className='social-login'>
              <div className="or-divider">
                <span>{t('OR')}</span>
              </div>
              <div className="social-login-btn-wrapper">
                <button 
                  type="button" 
                  className='social-login-btn line' 
                  onClick={handleSignUpWithLINE}
                >
                  <img src={lineIcon} alt="Line" />
                  <div className='text-wrap'>
                    {t('Sign up with LINE')}
                  </div>
                </button>

                <button 
                  type="button" 
                  className='social-login-btn kakao' 
                  onClick={handleSignUpWithKakao}
                >
                  <img src={kaKaoIcon} alt="Kakao" />
                  <div className='text-wrap'>
                    {t('Sign up with Kakao')}
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="verification-step">
            <div id="recaptcha-container"></div>
            {!otpSent ? (
              <>
                <p>{t('sendVerificationTo', { phone: getE164Phone() }) || `We will send a verification code to ${getE164Phone()}`}</p>
                <button className="primary-btn" onClick={sendOTP} disabled={loading}>
                  {loading ? <div className="spinner"></div> : (t('sendCode') || 'Send Code')}
                </button>
              </>
            ) : !otpVerified ? (
              <>
                <input type="text" className="account-input otp-input" placeholder={t('enterCodePlaceholder') || 'Enter 6-digit code'} value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
                <button className="primary-btn verify-btn" onClick={verifyOTP} disabled={loading}>
                  {loading ? <div className="spinner"></div> : (t('verifyCode') || 'Verify Code')}
                </button>
              </>
            ) : <p>{t('phoneVerified') || 'Phone number verified'}</p>}
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit}>
            {useEmail ? (
              <input type="text" className="account-input first" placeholder={t('usernamePlaceholder') || 'Username'} value={username} onChange={(e) => setUsername(e.target.value)} required />
            ) : (
              <>
                <input type="email" className="account-input first" placeholder={t('emailPlaceholder') || 'Email'} value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="text" className="account-input mid" placeholder={t('usernamePlaceholder') || 'Username'} value={username} onChange={(e) => setUsername(e.target.value)} required />
              </>
            )}
            <input type="password" className="account-input mid B" placeholder={t('passwordPlaceholder') || 'Password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="password" className="account-input last" placeholder={t('confirmPasswordPlaceholder') || 'Confirm Password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <div className="sing-up-disclaimer">
              <div className="disclaimer-wrap">
                {t('termsText') || 'By continuing, you agree to our'}&nbsp;
                <a href="/terms" target="_blank" rel="noopener noreferrer">{t('termsLink') || 'Terms'}</a>&nbsp;&{'\u00A0'}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">{t('privacyLink') || 'Privacy'}</a>.
              </div>
            </div>
            <button type="submit" disabled={loading}>{loading ? <div className="spinner"></div> : (t('createAccount') || 'Create Account')}</button>
          </form>
        )}

        <div className="login-links">
          <div>{t('alreadyHaveAccount') || 'Already have an account?'}</div>
          <a href="/login">{t('logIn') || 'Log in'}</a>
        </div>
      </div>
    </div>
  );
};

export default SignUp;