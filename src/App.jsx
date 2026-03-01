import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import HomepageLayout from './layouts/HomepageLayout';
import AccountLayout from './layouts/AccountLayout';
import MainLayout from './layouts/MainLayout';
import LegalLayout from './layouts/LegalLayout';

import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Terms from './pages/Terms';
import Registration from './pages/Registration';
import Recovery from './pages/Recovery';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';
import Shop from './pages/Shop';
import Payment from './pages/Payment';
import About from './pages/About';
import Search from './pages/Search';
import ProductDetails from './pages/ProductDetails';
import UserProfile from './pages/UserProfile'
import Game from './pages/Game'
import LineCallback from './pages/LineCallback';
import KakaoCallback from './pages/KakaoCallback';

import WithAdminAuth from './hoc/WithAdminAuth';
import ComingSoon from './components/ComingSoon';
import CartSync from './components/CartSync';


import './App.scss';
import i18n from './i18n';

function App() {
  const location = useLocation();

  function updateThemeColor(isDark) {
    const themeColor = isDark ? '#000000' : '#ffffff'; // adjust if you want different safe-area colors
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', themeColor);
  }
  
  useEffect(() => {
    /* ---------- 1. THEME: detect user system preference ---------- */
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Use saved theme if exists, otherwise follow system
    const savedTheme = localStorage.getItem('preferredTheme');
    const isDark = savedTheme
      ? savedTheme === 'dark'
      : prefersDark; // fallback to system

    document.documentElement.classList.toggle('dark-mode', isDark);
    updateThemeColor(isDark);

    // Automatically listen for system changes (e.g. iOS / macOS theme switch)
    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const themeListener = (e) => {
      if (!localStorage.getItem('preferredTheme')) {
        // only auto-update if user hasn't manually chosen a theme
        document.documentElement.classList.toggle('dark-mode', e.matches);
        updateThemeColor(e.matches);
      }
    };
    themeMedia.addEventListener('change', themeListener);

    /* ---------- 2. LANGUAGE: detect user system/browser language ---------- */
    const savedLang = localStorage.getItem('preferredLanguage');
    let langToUse = savedLang;

    if (!savedLang) {
      // try device/browser default
      const browserLang = navigator.language || navigator.userLanguage;
      // normalize code: "zh-TW", "ja", "ko", "en", etc.
      if (browserLang.startsWith('zh')) langToUse = 'zh-TW';
      else if (browserLang.startsWith('ja')) langToUse = 'jp';
      else if (browserLang.startsWith('ko')) langToUse = 'kr';
      else langToUse = 'en';
    }

    if (i18n.language !== langToUse) {
      i18n.changeLanguage(langToUse);
    }

    return () => themeMedia.removeEventListener('change', themeListener);
  }, [location]);

  

  return (
    <>
      <CartSync /> 
      <Routes>
      <Route
        path="/"
        element={
          <HomepageLayout>
            <Homepage />
          </HomepageLayout>
        }
      />
      <Route
        path="/login"
        element={
          <AccountLayout>
            <Login />
          </AccountLayout>
        }
      />
      <Route 
        path="/auth/line/callback" 
        element={
          <AccountLayout>
            <LineCallback />
          </AccountLayout>       
        } 
      />
      <Route 
        path="/auth/kakao/callback" 
        element={
          <AccountLayout>
            <KakaoCallback />
          </AccountLayout>       
        } 
      />

      <Route
        path="/signup"
        element={
          <AccountLayout>
            <Registration />
          </AccountLayout>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AccountLayout>
            <Recovery />
          </AccountLayout>
        }
      />
      <Route
        path="/about"
        element={
          <LegalLayout>
            <About />
          </LegalLayout>
        }
      />
      <Route
        path="/terms"
        element={
          <LegalLayout>
            <Terms />
          </LegalLayout>
        }
      />
      <Route
        path="/privacy"
        element={
          <LegalLayout>
            <Privacy />
          </LegalLayout>
        }
      />
      <Route
        path="/search"
        element={
          <MainLayout>
            <Search/>
          </MainLayout>
        }
      />

      <Route
        path="/ComingSoon"
        element={
          <MainLayout>
            <ComingSoon />
          </MainLayout>
        }
      />
      <Route
        path="/product"
        element={
          <MainLayout>
            <ComingSoon />
          </MainLayout>
        }
      />
      <Route
        path="/product/:id"
        element={
          <MainLayout>
            <ProductDetails />
            
          </MainLayout>
        }
      />
      <Route
        path="/storefront"
        element={
          <MainLayout>
            <Shop />
          </MainLayout>
        }
      />

      <Route
        path="/profile/:username"
        element={
          <MainLayout>
            <UserProfile />
          </MainLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <MainLayout>
            <Admin />
          </MainLayout>
        }
      />
      <Route
        path="/punchgame"
        element={
          <MainLayout>
            <Game />
          </MainLayout>
        }
      />
      
      <Route
        path="/checkout"
        element={
          <MainLayout>
            <Payment />
          </MainLayout>
        }
      />
      
    </Routes>
    </>
    
  );
}

export default App;
