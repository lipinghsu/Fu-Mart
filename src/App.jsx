import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import fumartLogo from './assets/fumart-1.png'
import './App.scss'

function App() {
  return (
    <div className="cg-root">
      <header className="cg-header">
        <h1>FÜ-MART</h1>
      </header>
      <main className="cg-main">
        <div className='logo-container'>
        <img
          src={fumartLogo}
        />
        </div>

      </main>
      <footer className="cg-footer">
        <div className="cg-footer-left">
          {/* <a className="cg-store-link" href="http://store.fumart.com/" target="_blank" rel="noopener noreferrer">STORE</a> */}
          
          <a className="cg-store-link" href="http://store.fumart.com/" target="_blank" rel="noopener noreferrer">COMING SOON</a>
          
          
          <div className="cg-disclaimer">
            © 2025 <a href="" target="_blank" rel="noopener noreferrer">FÜ-MART CORP</a>. ALL RIGHTS RESERVED. |
            <a href="" target="_blank" rel="noopener noreferrer"> TERMS AND CONDITIONS</a> |
            <a href="" target="_blank" rel="noopener noreferrer"> PRIVACY POLICY</a> |

            <a href="" target="_blank" rel="noopener noreferrer"> SEND US FEEDBACK</a>
          </div>
        </div>
        <div className="cg-footer-right">
          <form className="cg-newsletter" onSubmit={e => { e.preventDefault(); window.alert('Thank you for signing up!'); }}>
            <label htmlFor="cg-email" className="sr-only">Email Address</label>
            <input
              id="cg-email"
              type="email"
              className="cg-email-input"
              placeholder="Email Address"
              required
              aria-label="Email Address"
            />
            <button className="cg-join-btn" type="submit">JOIN</button>
          </form>
          <div className="cg-signup-disclaimer">
            By connecting, you agree to receive news and updates from Fü-mart.
          </div>
          {/* <div className="cg-social-icons">
            <a href="https://www.instagram.com/donaldglover/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src="/instagram.svg" alt="Instagram" />
            </a>
            <a href="https://www.tiktok.com/@donaldglover" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <img src="/tiktok.svg" alt="TikTok" />
            </a>
            <a href="https://www.facebook.com/donaldglover/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src="/facebook.svg" alt="Facebook" />
            </a>
          </div> */}
        </div>
      </footer>
    </div>
  );
}

export default App;
