import React from 'react';
import ProductCard from '../../../ProductCard'; // adjust path if different
// import './ProductModal.scss';

/**
 * Generic horizontal suggestions scroller
 *
 * Props:
 * - title: string (required)
 * - items: array of product docs [{ id, ...data }]
 * - loading: boolean
 * - onItemClick: (item) => void|Promise<void>
 * - listRef: React ref for the horizontal scroll container
 * - skeletonCount: number (default 8)
 * - wrapperClassName: string (optional, e.g., "brand-suggestions")
 * - t: i18n t function (optional, for default copies)
 * - emptyKind: "default" | "brand"
 * - emptyBrandName: string (brand name to show in brand empty state)
 * - emptyMessage: string (override message for default empty)
 */
const SuggestionsSection = ({
  title,
  items = [],
  loading = false,
  onItemClick,
  listRef,
  skeletonCount = 8,
  wrapperClassName = '',
  t,
  emptyKind = 'default',
  emptyBrandName = '',
  emptyMessage,
}) => {
  const defaultEmptyText = emptyMessage || t?.('noSuggestionsTitle') || 'No Related Products Found';

  const EmptyDefault = () => (
    <div className="noSuggestions-wrapper">
      <div className="no-suggestions-title">{defaultEmptyText}</div>
    </div>
  );

  // ⬇️ Brand empty uses the SAME visual block as noSuggestions-wrapper
  const EmptyBrand = () => (
    <div className="noSuggestions-wrapper brand-empty">
      <div className="no-suggestions-title">
        {t?.('noBrandProductsTitle') || 'No More From This Brand'}
      </div>
      {/* <div className="no-suggestions-sub">
        {emptyBrandName
          ? (t?.('noBrandProductsMsg', { brand: emptyBrandName }) ||
             `We couldn’t find other products from “${emptyBrandName}” right now.`)
          : (t?.('noBrandProductsMsgGeneric') || 'We couldn’t find other products from this brand right now.')}
      </div> */}
    </div>
  );

  return (
    <div className={`suggestions styled-suggestions ${wrapperClassName}`.trim()}>
      <div className="suggestion-title">
        <h2>{title}</h2>
      </div>

      <div className="suggested-items horizontal-scroll" ref={listRef}>
        {loading ? (
          Array.from({ length: skeletonCount }).map((_, i) => (
            <div className="suggested-item skeleton" key={`skel-${i}`}>
              <div className="skeleton-box" />
            </div>
          ))
        ) : items.length > 0 ? (
          items.map((item) => (
            <div className="suggested-item" key={item.id}>
              <ProductCard product={item} onClick={() => onItemClick?.(item)} t={t} />
            </div>
          ))
        ) : emptyKind === 'brand' ? (
          <EmptyBrand />
        ) : (
          <EmptyDefault />
        )}
      </div>
    </div>
  );
};

export default SuggestionsSection;
