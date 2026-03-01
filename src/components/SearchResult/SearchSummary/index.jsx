// src/components/SearchResult/SearchSummary/index.jsx
import React from 'react';
import './SearchSummary.scss';

const SearchSummary = ({
  // data
  loading,
  sortedLength,
  searchQuery,
  selectedCategory,
  selectedSubCategory, // (not used now, but handy later)
  allCategoryLabel,
  SALE_CATEGORY,

  // ui
  isDropdownActive,

  // i18n
  t,

  // (optional) if you want category display translations
  translateCategory = (c) => c,
}) => {
  const isCentered = sortedLength === 0;

  const heading = (() => {
    // 🏷️ On Sale tab
    if (selectedCategory === SALE_CATEGORY) {
      return (
        t('onSaleCount', { length: sortedLength }) ||
        `${sortedLength} 件特價商品`
      );
    }

    // viewall special case
    if (searchQuery && searchQuery.toLowerCase() === 'viewall') {
      if (selectedCategory === allCategoryLabel) {
        return (
          t('allCountProducts_viewall', { length: sortedLength }) ||
          `所有 ${sortedLength} 件店內商品`
        );
      }
      return (
        t('allCountProducts_noTerm', {
          length: sortedLength,
          category: translateCategory(selectedCategory),
        }) || `${sortedLength} 件商品在 ${selectedCategory} 區`
      );
    }

    // regular searchQuery
    if (searchQuery) {
      if (sortedLength === 0) {
        return (
          t(
            selectedCategory === allCategoryLabel
              ? 'nothingMatched_all'
              : 'nothingMatched',
            {
              searchQuery: t(searchQuery) || searchQuery,
              category:
                selectedCategory === allCategoryLabel
                  ? t('allSearchResults') || '所有搜尋結果'
                  : translateCategory(selectedCategory),
            }
          ) ||
          (selectedCategory === allCategoryLabel
            ? `找不到與 「${searchQuery}」 相關的商品`
            : `${selectedCategory} 區找不到與 「${searchQuery}」 相關的商品`)
        );
      }

      if (selectedCategory === allCategoryLabel) {
        return (
          t('searchResultsFor_all', {
            length: sortedLength,
            searchQuery: t(searchQuery) || searchQuery,
          }) || `${sortedLength} 件與 「${searchQuery}」 相關的商品`
        );
      }

      return (
        t('searchResultsFor_withCategory', {
          length: sortedLength,
          searchQuery: t(searchQuery) || searchQuery,
          category: translateCategory(selectedCategory),
        }) || `${sortedLength} 件與 「${searchQuery}」 相關的商品在 ${selectedCategory} 區`
      );
    }

    // no search term
    return (
      t('allCountProducts_noTerm', {
        length: sortedLength,
        category:
          selectedCategory === allCategoryLabel
            ? t('allSearchResults') || '所有搜尋結果'
            : translateCategory(selectedCategory),
      }) ||
      `${sortedLength} 件商品在 ${
        selectedCategory === allCategoryLabel ? '所有搜尋結果' : selectedCategory
      } 區`
    );
  })();

  return (
    <div
      className={[
        'search-summary',
        isCentered ? 'center' : 'left',
        isDropdownActive ? 'blurred' : '',
      ].join(' ')}
    >
      <h2>{heading}</h2>

      {!loading && sortedLength === 0 && (
        <div className="no-results-wrap">
          <div className="no-results-message">
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results solid">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results outline">{t('noResultsFound')}</div>
            <div className="no-results subtitle">{t('tryAnotherSearch')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSummary;
