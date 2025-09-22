import React from 'react';
import './PriceBlock.scss';

const PriceBlock = ({ isSoldOut, isOnSale, price, finalPrice, t }) => {
  return (
    <div className={`price-wrap ${isOnSale ? 'on-sale' : ''} ${isSoldOut ? 'sold-out' : ''}`}>
      {isSoldOut ? (
        <>
          <span className="price current soldout-label">{t('soldOut') || 'SOLD OUT'}</span>
          <div className="isSoldOut-wrap">
            {price ? (
              <span className="price original">
                ${price.toFixed(2)}&nbsp;<span className="currency">USD</span>
              </span>
            ) : null}
          </div>
        </>
      ) : isOnSale ? (
        <>
          <span className="price current">${finalPrice.toFixed(2)}</span>
          <div className="isOnSale-wrap">
            {price ? (
              <span className="price original">
                <span className="amount">${price.toFixed(2)}</span>
                <span className="currency"> USD</span>
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <span className="price">{price ? `$${price.toFixed(2)}` : '--'}</span>
          <span className="currency">USD</span>
        </>
      )}
    </div>
  );
};

export default PriceBlock;
