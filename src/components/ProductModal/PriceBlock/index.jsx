import React from 'react';
import './PriceBlock.scss';

const PriceBlock = ({
  isSoldOut,
  isOnSale,
  price,
  finalPrice,
  currencySymbol = '$',
  selectedCurrency = 'USD',
  t
}) => {
  return (
    <div
      className={`price-wrap ${isOnSale ? 'on-sale' : ''} ${
        isSoldOut ? 'sold-out' : ''
      }`}
    >
      {isSoldOut ? (
        <>
          <span className="price current soldout-label">
            {t('soldOut') || 'SOLD OUT'}
          </span>
          <div className="isSoldOut-wrap">
            {price ? (
              <span className="price original">
                
                {price.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })}
                &nbsp;<span className="currency">{selectedCurrency}</span>
              </span>
            ) : null}
          </div>
        </>
      ) : isOnSale ? (
        <>
          <span className="price current">
            
            {finalPrice.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            })}
            &nbsp;
            <span className="currency"> {selectedCurrency}</span>
          </span>
          <div className="isOnSale-wrap">
            {price ? (
              <span className="price original">
                <span className="amount">
                  
                  {price.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  })}
                </span> 
                &nbsp;
                <span className="currency"> {selectedCurrency}</span>
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <span className="price">
            {price
              ? `${price.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })}`
              : '--'}
          </span>
          &nbsp;
          <span className="currency">{selectedCurrency}</span>
        </>
      )}
    </div>
  );
};

export default PriceBlock;
