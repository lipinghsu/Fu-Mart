
// import React, { useEffect, Suspense, useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { Routes, Route } from 'react-router-dom';
// // import { checkUserSession } from './redux/User/user.actions';
// // import AdminToolbar from './components/AdminToolbar';

// // hoc
// // import WithAuth from './hoc/withAuth';
// // import WithAdminAuth from './hoc/withAdminAuth';

// // layouts
// // import MainLayout from './layouts/MainLayout';
// import HomepageLayout from './layouts/HomepageLayout';
// import AccountLayout from './layouts/AccountLayout';
// // import CheckoutLayout from './layouts/CheckoutLayout';
// // import AboutLayout from './layouts/AboutLayout';
// // import DashBoardLayout from './layouts/DashboardLayout';
// import AdminLayout from './layouts/AdminLayout';

// // pages
// import Homepage from './pages/Homepage';
// import Search from './pages/Search';



// // import Dashboard from './pages/Dashboard';

// // import ProductDetails from './pages/ProductDetails';
// // import Cart from './pages/Cart';
// // import Payment from './pages/Payment';
// // import Order from './pages/Order';
// // import ProfProfile from './components/ProfProfile';
// import Terms from './pages/Terms';
// import Privacy from './pages/Privacy';
// Privacy
// // import About from './pages/About';

// // import SearchResults from './components/SearchResults';

// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import fumartLogo from './assets/fumart-1.png'

// import './App.scss'


// function App() {
//   return (
//     <Routes>
//       <Route
//         path="/"
//         element={
//           <HomepageLayout>
//             <Homepage />
//           </HomepageLayout>
//         }
//       />
//       {/* <Route
//         path="/registration"
//         element={
//           <AccountLayout>
//             <Registration />
//           </AccountLayout>
//         }
//       />
//       <Route
//         path="/login"
//         element={
//           <AccountLayout>
//             <Login />
//           </AccountLayout>
//         }
//       />
//       <Route
//         path="/recovery"
//         element={
//           <AccountLayout>
//             <Recovery />
//           </AccountLayout>
//         }
//       /> */}
//       <Route
//         path="/terms"
//         element={
//           <AccountLayout>
//             <Terms />
//           </AccountLayout>
//         }
//       />
//       <Route
//         path="/privacy"
//         element={
//           <AccountLayout>
//             <Privacy />
//           </AccountLayout>
//         }
//       />
//       {/* <Route
//         path="/about"
//         element={
//           <AboutLayout>
//             <About />
//           </AboutLayout>
//         }
//       /> */}
//       {/* <Route
//         path="/search"
//         element={
//           <MainLayout>
//             <SearchResults />
//           </MainLayout>
//         }
//       />
//       <Route
//         path="/dashboard"
//         element={
//           <WithAuth>
//             <DashBoardLayout>
//               <Dashboard />
//             </DashBoardLayout>
//           </WithAuth>
//         }
//       />
//       <Route
//         path="/admin"
//         element={
//           <WithAdminAuth>
//             <MainLayout>
//               <AdminLayout>
//                 <Admin />
//               </AdminLayout>
//             </MainLayout>
//           </WithAdminAuth>
//         }
//       /> */}
//     </Routes>
//   );
// }

// export default App;

import React, { useEffect } from 'react';


import { Routes, Route, useLocation } from 'react-router-dom';
import HomepageLayout from './layouts/HomepageLayout';
import AccountLayout from './layouts/AccountLayout';
import MainLayout from './layouts/MainLayout';

import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Terms from './pages/Terms';
import Registration from './pages/Registration';
import Recovery from './pages/Recovery';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';
import Shop from './pages/Shop';

import WithAdminAuth from './hoc/WithAdminAuth';

// import ProductResults from './components/ProductResults'
import ComingSoon from './components/ComingSoon'

import './App.scss';
import i18n from './i18n';

function App() {
  const location = useLocation();

  useEffect(() => {
    // Theme (dark mode)
    const savedTheme = localStorage.getItem('preferredTheme');
    const isDark = savedTheme === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);

    // Language
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [location]);

  return (
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
        path="/terms"
        element={
          <AccountLayout>
            <Terms />
          </AccountLayout>
        }
      />

      <Route
        path="/privacy"
        element={
          <AccountLayout>
            <Privacy />
          </AccountLayout>
        }
      />

      <Route
        path="/search"
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
            <Shop/>
          </MainLayout>
        }
      />

    <Route
      path="/admin"
      element={
        // <WithAdminAuth>
          <MainLayout>
            <Admin />
          </MainLayout>
        // </WithAdminAuth>
      }
    />
    </Routes>
  );
}

export default App;

