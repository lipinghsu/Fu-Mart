import React from 'react';
import './ArrowNav.scss';

const ArrowNav = ({
  isMobile,
  closeImage,
  arrowIcon,
  arrowIcon2,
  fumartTextLogo,
  currentIndex = 0,
  total = 0,
  onClose,
  onPrev,
  onNext
}) => {
  const isFirst = currentIndex <= 0;
  const isLast  = total > 0 ? currentIndex >= total - 1 : true;

  const handlePrev = (e) => {
    e.stopPropagation();
    if (!isFirst) onPrev?.();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (!isLast) onNext?.();
  };

  return (
    <div
      className={`arrow-buttons-wrap ${isMobile ? 'is-mobile' : ''}`}
      {...(isMobile && { onClick: (e) => e.stopPropagation() })}
    >
      <div className="close-button" onClick={onClose} aria-label="Close">
        <img src={closeImage} alt="close" />
      </div>

      {isMobile && (
        <div className="fumart-logo-wrapper" aria-hidden>
          <img src={fumartTextLogo} alt="logo" />
        </div>
      )}

      {/* Dock the inner control bar to the bottom on mobile */}
      <div
        className={`arrow-buttons-wrap-inner ${isMobile ? 'at-bottom' : ''}`}
        onClick={onClose}
      >
        <button
          className={[
            'arrow-button',
            'left',
            isFirst ? 'is-disabled' : '',
            // hide on desktop when first
            !isMobile && isFirst ? 'is-hidden' : '',
          ].join(' ')}
          onClick={handlePrev}
          aria-label="Previous image"
          disabled={isMobile ? isFirst : false}
          aria-hidden={!isMobile && isFirst ? 'true' : 'false'}
          tabIndex={!isMobile && isFirst ? -1 : 0}
        >
          <img src={isMobile ? arrowIcon2 : arrowIcon} alt="" />
        </button>

        <button
          className={[
            'arrow-button',
            'right',
            isLast ? 'is-disabled' : '',
            // hide on desktop when last
            !isMobile && isLast ? 'is-hidden' : '',
          ].join(' ')}
          onClick={handleNext}
          aria-label="Next image"
          disabled={isMobile ? isLast : false}
          aria-hidden={!isMobile && isLast ? 'true' : 'false'}
          tabIndex={!isMobile && isLast ? -1 : 0}
        >
          <img src={isMobile ? arrowIcon2 : arrowIcon} alt="" />
        </button>
      </div>
    </div>
  );
};

export default ArrowNav;
