import React from 'react';
import './ProductCard.scss';

const ProductCard = ({ product, onClick, t, isDarkMode }) => {
  return (
    <div className={`product-card loaded ${isDarkMode ? 'dark' : ''}`} onClick={() => onClick(product)}>
      {product.images?.[0] && (
        <div className="product-image-wrap">
          <img src={product.images[0]} alt={product.name} className="product-image" />
        </div>
      )}
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <p className="subtitle">{product.subtitle}</p>
        <p className="price">
          <span>${product.price.toFixed(2)}</span>
        </p>
      </div>
      <button className="add-to-cart-btn">
        <span className="text-default">{t('add')}</span>
        <span className="text-hover">{t('addToCart')}</span>
      </button>
    </div>
  );
};

export default ProductCard;
