import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import signUpImageB from './../../../assets/fu.png'
import './SignupSection.scss';

const SignupSection = () => {
  const { t } = useTranslation(['home']);
  const signupLeftRef = useRef(null);
  const signupRightRef = useRef(null);
  const [isSignupRightVisible, setIsSignupRightVisible] = useState(true);
  const [isSignupLeftVisible, setIsSignupLeftVisible] = useState(false);

  useEffect(() => {
    const leftObserver = new IntersectionObserver(
      ([entry]) => {
        setIsSignupLeftVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    const rightObserver = new IntersectionObserver(
      ([entry]) => {
        setIsSignupRightVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (signupLeftRef.current) leftObserver.observe(signupLeftRef.current);
    if (signupRightRef.current) rightObserver.observe(signupRightRef.current);

    return () => {
      if (signupLeftRef.current) leftObserver.unobserve(signupLeftRef.current);
      if (signupRightRef.current) rightObserver.unobserve(signupRightRef.current);
    };
  }, []);

  return (
    <div className="signup-section">
      <div className="signup-section-wrap">
        
        <div
          className={`signup-left ${isSignupLeftVisible ? 'slide-in' : 'slide-out'}`}
          ref={signupLeftRef}
        >
          <div className='signup-section-img-wrap'>
            <img src={signUpImageB} alt="Join Us" />
          </div>
        </div>
        <div
          className={`signup-right ${isSignupRightVisible ? 'slide-in' : 'slide-out'}`}
          ref={signupRightRef}
        >
          <div className='signup-title'>
            {t('home:signupTitle', 'Our goods? Not for just anyone')}
          </div>
          <div className='signup-text'>
            {t(
              'home:signupDesc',
              'Sign up now for early access to limited releases and exclusive member perks.'
            )}
          </div>
          <div className="signup-buttons">
            <button
              className="primary-btn"
              onClick={() => window.location.href = '/about'}
            >
              {t('home:learnMore', 'Learn More').toUpperCase()}
            </button>
            <button
              className="secondary-btn"
              onClick={() => window.location.href = '/signup'}
            >
              
              {t('home:signupNow', 'Sign Up').toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupSection;
