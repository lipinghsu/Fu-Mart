import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './BrowseTitle.scss';

const BrowseTitle = ({ filterBy, setFilterBy }) => {
  const { t } = useTranslation(['storefront']);
  const navigate = useNavigate();
  const options = ['category', 'origin', 'brand'];

  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
  const labelFor = (key) => capitalize(t(key));

  const handleSelect = (option) => {
    setFilterBy(option);
  };

  return (
    <div className="browse-title-wrap">
      <h2 className="browse-title">
        {t('browseByLabel')}{' '}
        <div className="custom-dropdown">
          {options.map((option) => (
            <div
              key={option}
              className={`dropdown-item ${option === filterBy ? 'active' : ''}`}
              onClick={() => handleSelect(option)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === 'Enter' || e.key === ' ') && handleSelect(option)
              }
            >
              <span className="item-text">{labelFor(option)}</span>
            </div>
          ))}
        </div>
        {/* View All */}
        <span
          className="view-all-link"
          onClick={() => navigate('/search?term=viewall')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/search?term=viewall')}
        >
          {t('shopAll')}
        </span>
      </h2>
    </div>
  );
};

export default BrowseTitle;