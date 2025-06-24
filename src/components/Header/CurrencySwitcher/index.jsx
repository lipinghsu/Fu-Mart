import React, { useState, useEffect } from 'react';

const CurrencySwitcher = ({ selectedCurrency, setSelectedCurrency, t }) => {
  const handleCurrencyChange = (e) => {
    const value = e.target.value;
    setSelectedCurrency(value);
    localStorage.setItem('preferredCurrency', value);
  };

  return (
    <div className="currency-switcher">
      {/* <label htmlFor="currency-select" className="currency-label">
        {t('currency') || 'Currency'}:
      </label> */}
      <select
        id="currency-select"
        value={selectedCurrency}
        onChange={handleCurrencyChange}
        className="currency-select"
      >
        
        <option value="JPY">¥ JPY (円)</option>
        <option value="KRW">₩ KRW (원)</option>
        <option value="TWD">NT$ TWD(元)</option>
        <option value="USD">$ USD (Dollar)</option>
      </select>
    </div>
  );
};

export default CurrencySwitcher;
