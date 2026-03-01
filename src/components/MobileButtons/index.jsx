import React, { useState, useEffect } from 'react';
import './MobileButtons.scss';
import bagIcon from '../../assets/Icons/bagIcon-filled.png';
import sideMenuIcon from '../../assets/Icons/side-menu-icon.png';
import SearchBar from '../SearchBar';

const MobileButtons = ({
  isSmallScreen,
  searchExpanded,
  setSearchExpanded,
  totalItemCount,
  setIsCartOpen,
  setIsSideMenuOpen,
  blink,
  hideMobileButtons
}) => {
  const [hasSearchInput, setHasSearchInput] = useState(false);

  // Disable background scroll when search is expanded
  useEffect(() => {
    if (searchExpanded) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }, [searchExpanded]);

  // Fix for iOS Safari keyboard pushing fixed elements
  useEffect(() => {
    if (window.visualViewport) {
      const adjustForKeyboard = () => {
        const vhOffset = window.visualViewport.offsetTop;
        document.documentElement.style.setProperty('--keyboard-offset', `${vhOffset}px`);
      };

      window.visualViewport.addEventListener('resize', adjustForKeyboard);
      window.visualViewport.addEventListener('scroll', adjustForKeyboard);
      adjustForKeyboard();

      return () => {
        window.visualViewport.removeEventListener('resize', adjustForKeyboard);
        window.visualViewport.removeEventListener('scroll', adjustForKeyboard);
      };
    }
  }, []);

  if (!isSmallScreen || hideMobileButtons) return null;

  const moveUp = searchExpanded && hasSearchInput ? '' : '';

  return (
    <div className="mobile-buttons-container">
      <div className="mobile-search-bar">
        <SearchBar
          isExpanded={searchExpanded}
          setIsExpanded={setSearchExpanded}
          onInputChange={(value) => setHasSearchInput(value.trim().length > 0)}
        />
      </div>

      <div
        className={`floating-cart-btn ${blink ? 'blinking' : ''} ${moveUp}`}
        onClick={() => setIsCartOpen(true)}
      >
        <div className="bag-img-wrap">
          <img src={bagIcon} alt="Cart" />
        </div>
        {totalItemCount > 0 && <span className="bag-count">{totalItemCount}</span>}
      </div>

      <div
        className={`floating-menu-btn ${moveUp}`}
        onClick={() => setIsSideMenuOpen(true)}
      >
        <div className="side-menu-icon-wrap">
          <img src={sideMenuIcon} alt="Menu" />
        </div>
      </div>
    </div>
  );
};

export default MobileButtons;
