import React from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import './ProductCard.scss';

const ProductCard = ({ product, onClick, t, isDarkMode }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    const safeProduct = {
      ...product,
      createdAt: product.createdAt?.toDate
        ? product.createdAt.toDate().toISOString()
        : product.createdAt,
    };

    dispatch(addToCart(safeProduct));
  };

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
      <button className="add-to-bag-btn" onClick={handleAddToCart}>
        <span className="text-default">{t('buy')}</span>
        <span className="text-hover">{t('addToBag')}</span>
      </button>
    </div>
  );
};

export default ProductCard;


