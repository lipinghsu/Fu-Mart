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
    // Theme (dark mode)
    const savedTheme = localStorage.getItem('preferredTheme');
    const isDark = savedTheme === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);

    // Update safe area / status bar color
    updateThemeColor(isDark);

    // Language
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
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
        path="/storefront"
        element={
          <MainLayout>
            <Shop />
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
