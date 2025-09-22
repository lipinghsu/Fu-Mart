import React, { useEffect } from 'react';
import './QuantityControl.scss';
const QuantityControl = ({
  dropdownRef,
  dropdownOpen,
  setDropdownOpen,
  quantity,
  stockQuantity,
  currentCartQuantity,
  t,
  onSelectQuantity,
  onRemove,
}) => {
  // ✅ Close on outside click (pointer) and on ESC
  useEffect(() => {
    if (!dropdownOpen) return;

    const handlePointerDown = (e) => {
      const el = dropdownRef?.current;
      if (!el) return;
      const inside = e.composedPath ? e.composedPath().includes(el) : el.contains(e.target);
      if (!inside) setDropdownOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    // capture phase so we catch it even if something stops propagation
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen, dropdownRef, setDropdownOpen]);

  const maxCount = Math.max(
    0,
    Math.min(
      Number.isFinite(Number(stockQuantity)) ? Number(stockQuantity) : 9,
      9
    )
  );

  return (
    <div className="quantity-control" ref={dropdownRef}>
      <div
        className={`quantity-button ${dropdownOpen ? 'active' : ''} ${
          currentCartQuantity > 0
            ? quantity !== currentCartQuantity
              ? 'quantity-changed'
              : 'in-bag'
            : ''
        }`}
        onClick={() => setDropdownOpen((o) => !o)}
      >
        <span className="selected-quantity">
          {currentCartQuantity > 0 && quantity === currentCartQuantity
            ? `${currentCartQuantity} ${t('inBag')}`
            : `${t('quantity')}: ${quantity}`}
        </span>
        <span className="arrow">▼</span>
      </div>

      <div className={`quantity-dropdown ${dropdownOpen ? 'open' : ''}`}>
        <div className="option block" />
        {Array.from({ length: maxCount }).map((_, i) => {
          const val = i + 1;
          const isSelected = currentCartQuantity === val;
          return (
            <div
              key={val}
              className={`option ${isSelected ? 'selected-option' : ''}`}
              onClick={() => onSelectQuantity(val)}
            >
              <span>{val}</span>
              {isSelected && <div className="check-mark" />}
            </div>
          );
        })}

        {(stockQuantity == null || Number(stockQuantity) > 9) && (
          <div className="option" onClick={() => onSelectQuantity(10)}>
            {t('customQuantity')}
          </div>
        )}

        {currentCartQuantity > 0 && (
          <div className="option remove-option" onClick={onRemove}>
            {t('removeFromBag') || 'Remove from Bag'}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantityControl;
