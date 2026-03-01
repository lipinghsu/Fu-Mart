import React from 'react';
import { useCurrency } from '../../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import arrowIcon from '../../../assets/Icons/arrowIcon.png';
import './CurrencySwitcher.scss';

const CurrencySwitcher = () => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { t } = useTranslation('header');

  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
  };

  return (
    <div className="currency-switcher">
      <div className="select-wrapper">
        <select
          id="currency-select"
          value={selectedCurrency}
          onChange={handleCurrencyChange}
          className="currency-select"
        >
          <option value="USD">$ USD ({t('currency.usd')})</option>
          <option value="JPY">¥ JPY ({t('currency.jpy')})</option>
          <option value="KRW">₩ KRW ({t('currency.krw')})</option>
          <option value="TWD">NT$ TWD ({t('currency.twd')})</option>
          
        </select>
        <img src={arrowIcon} alt="arrow" className="arrow-icon" />
      </div>
    </div>
  );
};

export default CurrencySwitcher;
