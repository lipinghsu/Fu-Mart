import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
// Assuming './VariationSwatches.scss' is in the same folder
import './VariationSwatches.scss';

const VariationSwatches = ({
  product,
  siblingVariations,
  isLoading,
  onSelect,
  className = '',
}) => {
  const { t } = useTranslation(['storefront']);

  const labelKey =
    (product?.variationOption?.name || '').trim().toLowerCase() || 'variation';
  const label = t(`variation.${labelKey}`, {
    defaultValue: product?.variationOption?.name || 'Variation',
  });

  if (isLoading) {
    return (
      <div className={`variation-group ${className}`}>
        <div className="variation-label">{label}</div>
        <div className="variation-swatches">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="swatch skeleton-visible" />
          ))}
        </div>
      </div>
    );
  }

  if (!Array.isArray(siblingVariations) || siblingVariations.length <= 1) {
    return null;
  }

  return (
    <div className={`variation-group ${className}`}>
      <div className="variation-label">{label}</div>
      <div className="variation-swatches">
        {siblingVariations.map((v) => (
          <SwatchButton
            key={v.id}
            product={product}
            variant={v}
            isActive={v.id === product.id}
            onSelect={onSelect}
            t={t}
          />
        ))}
      </div>
    </div>
  );
};

const SwatchButton = ({ product, variant, isActive, onSelect, t }) => {
  const valueKey = (variant.variationOption?.value || '')
    .replace(/\s+/g, '')
    .toLowerCase();

  const translatedValue = t(`variation.${valueKey}`, {
    defaultValue: variant.variationOption?.value || '—',
  });

  const spanRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (spanRef.current) {
      const el = spanRef.current;
      // Calculate the precise amount of overflow
      const overflowAmount = el.scrollWidth - el.clientWidth;

      if (overflowAmount > 0) {
        setIsOverflowing(true);
        // Set a CSS custom property with the overflow amount (plus a small buffer)
        // This will be used by the CSS animation
        el.style.setProperty('--overflow-amount', `${overflowAmount + 4}px`);
      } else {
        setIsOverflowing(false);
        // Remove the property if it's no longer overflowing
        el.style.removeProperty('--overflow-amount');
      }
    }
  }, [translatedValue]); // Re-run this check whenever the text content changes

  return (
    <button
      className={`swatch ${isActive ? 'active' : ''}`}
      title={translatedValue}
      onClick={() => !isActive && onSelect?.(variant)}
    >
      <span
        ref={spanRef}
        className={isOverflowing ? 'overflowing' : ''}
      >
        {translatedValue}
      </span>
    </button>
  );
};

VariationSwatches.propTypes = {
  product: PropTypes.object.isRequired,
  siblingVariations: PropTypes.array,
  isLoading: PropTypes.bool,
  onSelect: PropTypes.func,
  className: PropTypes.string,
};

export default VariationSwatches;
