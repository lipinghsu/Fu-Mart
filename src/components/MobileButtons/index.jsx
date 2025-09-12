import React from 'react';
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
  if (!isSmallScreen || hideMobileButtons) return null;

  return (
    <div className="mobile-buttons-container">
      <div className="mobile-search-bar">
        <SearchBar isExpanded={searchExpanded} setIsExpanded={setSearchExpanded} />
      </div>

      <div
        className={`floating-cart-btn ${blink ? 'blinking' : ''} ${searchExpanded ? 'move-up' : ''}`}
        onClick={() => setIsCartOpen(true)}
      >
        <div className="bag-img-wrap">
          <img src={bagIcon} alt="Cart" />
        </div>
        {totalItemCount > 0 && <span className="bag-count">{totalItemCount}</span>}
      </div>

      <div
        className={`floating-menu-btn ${searchExpanded ? 'move-up' : ''}`}
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
