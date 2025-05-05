
import React, { useEffect, Suspense, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
// import { checkUserSession } from './redux/User/user.actions';
// import AdminToolbar from './components/AdminToolbar';

// hoc
// import WithAuth from './hoc/withAuth';
// import WithAdminAuth from './hoc/withAdminAuth';

// layouts
// import MainLayout from './layouts/MainLayout';
import HomepageLayout from './layouts/HomepageLayout';
// import AccountLayout from './layouts/AccountLayout';
// import CheckoutLayout from './layouts/CheckoutLayout';
// import AboutLayout from './layouts/AboutLayout';
// import DashBoardLayout from './layouts/DashboardLayout';
// import AdminLayout from './layouts/AdminLayout';

// pages
import Homepage from './pages/Homepage';
// import Search from './pages/Search';
// import Registration from './pages/Registration';
// import Login from './pages/Login';
// import Recovery from './pages/Recovery';
// import Dashboard from './pages/Dashboard';
// import Admin from './pages/Admin';
// import ProductDetails from './pages/ProductDetails';
// import Cart from './pages/Cart';
// import Payment from './pages/Payment';
// import Order from './pages/Order';
// import ProfProfile from './components/ProfProfile';
// import Terms from './pages/Terms';
// import About from './pages/About';

// import SearchResults from './components/SearchResults';

import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import fumartLogo from './assets/fumart-1.png'

import './App.scss'


function App() {

  return(
    <Routes>
      <Route
        path="/"
        element={
          <HomepageLayout>
            <Homepage />
          </HomepageLayout>
        }
      />
      {/* <Route path="/registration" render={() => (
        <AccountLayout>
          <Registration />
        </AccountLayout>
      )} />
      <Route path="/login" render={() => (
        <AccountLayout>
          <Login />
        </AccountLayout>
      )} />
      <Route path="/recovery" render={() => (
        <AccountLayout>
          <Recovery />
        </AccountLayout>
      )} />
      <Route path="/terms" render={() => (
        <AccountLayout>
          <Terms />
        </AccountLayout>
      )} />
      <Route path="/about" render={() => (
        <AboutLayout>
          <About />
        </AboutLayout>
      )} />
      <Route path="/search" render={() => (
        <MainLayout>
          <SearchResults />
        </MainLayout>
      )} />
      <Route path="/dashboard" render={() => (
        <WithAuth>
          <DashBoardLayout>
            <Dashboard />
          </DashBoardLayout>
        </WithAuth>
      )} />
      <Route path="/admin" render={() => (
        <WithAdminAuth>
          <MainLayout>
            <AdminLayout>
              <Admin />
            </AdminLayout>
          </MainLayout>
        </WithAdminAuth> */}
      {/* )} /> */}
    </Routes>
  )
 
}

export default App;
