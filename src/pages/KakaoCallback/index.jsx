import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../firebase/utils';
import { signInWithCustomToken } from 'firebase/auth';
import fumartTextLogo from '../../assets/fumart-text-logo-bombarda.png';
import './KakaoCallback.scss'; // Reusing your existing SCSS for consistency

const KakaoCallback = () => {
  const [message, setMessage] = useState('正在處理 Kakao 登入...');
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Data State
  const [kakaoUserId, setKakaoUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // DOB State
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  
  const [errorDetail, setErrorDetail] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasCalledAPI = useRef(false);

  const years = Array.from({ length: 107 }, (_, i) => 2026 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      setMessage(error ? 'Kakao 登入失敗' : '缺少授權碼');
      setLoading(false);
      return;
    }

    if (hasCalledAPI.current) return;
    hasCalledAPI.current = true;

    handleExchange(code);
  }, [searchParams]);

  const handleExchange = async (code) => {
    try {
      // Replace with your actual Cloud Function URL for Kakao
      const res = await fetch('https://us-central1-fu-mart-8.cloudfunctions.net/kakaoLoginCallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '後端處理失敗');
      }

      if (data.exists) {
        setMessage('歡迎回來！正在登入...');
        await signInWithCustomToken(auth, data.customToken);
        setTimeout(() => navigate('/', { replace: true }), 800);
        return;
      }

      setKakaoUserId(data.kakaoUserId);
      setDisplayName(data.displayName);
      setEmail(data.email || '');
      setName(data.displayName);
      setAvatar(data.avatar); 
      setShowConfirm(true);

    } catch (err) {
      console.error("Kakao Exchange Error:", err);
      setMessage('登入失敗');
      setErrorDetail(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setShowConfirm(false);
    setShowForm(true);
  };

  const handleSubmitForm = async () => {
    if (!username || !birthYear || !birthMonth || !birthDay) {
      alert('請填寫完整資料（包含生日）');
      return;
    }

    setLoading(true);
    const dobString = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

    try {
      // Replace with your actual Cloud Function URL for creating Kakao users
      const res = await fetch('https://us-central1-fu-mart-8.cloudfunctions.net/createKakaoUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kakaoUserId,
          username,
          name: name || displayName,
          email: email || null,
          dob: dobString,
          avatar: avatar || null 
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '創建失敗');
      }

      await signInWithCustomToken(auth, data.customToken);
      setMessage('帳號創建成功！正在跳轉...');
      setTimeout(() => navigate('/', { replace: true }), 800);
    } catch (err) {
      setErrorDetail(err.message);
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/login', { replace: true });

  const isFormValid = username && birthYear && birthMonth && birthDay;

  return (
    <div className="signup-page">
      <div className="logo-container" onClick={() => navigate('/')}>
        <img src={fumartTextLogo} alt="Fü-Mart" />
      </div>

      <div className="callback-content">
        <div className="signup-card">
          {loading ? (
            <div style={{ padding: '40px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 20px', borderColor: '#d2d2d9', borderTopColor: '#323233' }}></div>
              <div className="signup-title">{message}</div>
            </div>
          ) : showConfirm ? (
            <div className="confirm-box">
              <h2 className="signup-title">尚未註冊</h2>
              <p className="signup-subtitle" style={{ color: '#e5341d'}}>這個 Kakao 帳號尚未與 Fü-Mart 綁定</p>
              <div style={{ marginTop: '24px' }}>
                <button className="primary-btn" onClick={handleCreateAccount}>創建新帳號</button>
                <div className="login-links" style={{ marginTop: '16px' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleCancel(); }}>回到登入</a>
                </div>
              </div>
            </div>
          ) : showForm ? (
            <div className="signup-step1">
              <h2 className="signup-title">補充您的資料</h2>
              <p className="signup-subtitle">完成後即可開始Fü-Mart獨特的購物體驗</p>
              
              <form onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="text" 
                  className="first" 
                  placeholder="顯示名稱" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
                <input 
                  type="text" 
                  className="last" 
                  placeholder="使用者名稱 (必填)" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                />

                <div className="dob-section" style={{ marginTop: '16px' }}>
                  <div className="dob-selects">
                    <select className="dob-select" value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>
                      <option value="" disabled>月</option>
                      {months.map(m => <option key={m} value={m}>{m}月</option>)}
                    </select>
                    <select className="dob-select" value={birthDay} onChange={e => setBirthDay(e.target.value)}>
                      <option value="" disabled>日</option>
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className="dob-select" value={birthYear} onChange={e => setBirthYear(e.target.value)}>
                      <option value="" disabled>年</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <p className="dob-desc">請確認您的年齡。</p>
                </div>

                <button 
                  className="primary-btn" 
                  onClick={handleSubmitForm} 
                  disabled={loading || !isFormValid}
                >
                  {loading ? <div className="spinner"></div> : '完成註冊並登入'}
                </button>
                
                <div className="login-links" style={{ marginTop: '16px' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleCancel(); }}>取消並返回</a>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <h2 className="signup-title">{message}</h2>
              {errorDetail && <p style={{ color: '#e5341d', fontSize: '0.9rem', marginTop: '8px' }}>{errorDetail}</p>}
              <button className="primary-btn" style={{ marginTop: '16px' }} onClick={handleCancel}>返回</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KakaoCallback;