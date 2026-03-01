import React from 'react';
import ProductCard from '../../ProductCard';
import './SuggestionsSection.scss';

/**
 * Generic horizontal suggestions scroller
 *
 * Props:
 * - title: string (required)
 * - brand: string (optional, used to identify brand suggestions)
 * - onViewAll: () => void (optional, click handler for "View All")
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
  brand,
  onViewAll,
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

  const EmptyBrand = () => (
    <div className="noSuggestions-wrapper brand-empty">
      <div className="no-suggestions-title">
        {t('noBrandProductsTitle', { brand: emptyBrandName || title })}
      </div>
    </div>
  );

  // Check if we should show the "View All" link
  const showViewAll = !!brand ;

  return (
    <div className={`suggestions styled-suggestions ${wrapperClassName}`.trim()}>
      <div className="suggestion-title">
        <h2>{title}</h2>
        {showViewAll && (
          <button className="suggestion-view-all" onClick={onViewAll}>
            {t?.('viewAll') || 'View All'} ＞
          </button>
        )}
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