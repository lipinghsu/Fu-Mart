import React, { useState, useEffect, useRef } from 'react';
import fumartLogo from './../../assets/fumart-1.png';
import './styles.scss';

const Directory = ({ showSignupDropdown, setShowSignupDropdown }) => { 
  return (  
    <div className="cg-root">
      <header className="cg-header">
        <h1>FÜ-MART</h1>
        <div className='cg-sub-title'>福爾摩沙島最屌的便利商店</div>
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
            © 2025 <a href="" target="_blank" rel="noopener noreferrer" className='fu-mart-text'>FÜ-MART</a> | ALL RIGHTS RESERVED
          </div>
          <div className="cg-disclaimer">
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
            By connecting, you agree to receive news and updates from Fü-Mart.
          </div>
        </div>
      </footer>
    </div>
  );

};

export default Directory;
