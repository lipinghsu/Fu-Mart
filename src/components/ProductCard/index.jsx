
import React, { useState } from 'react';

import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import './ProductCard.scss';

const ProductCard = ({ product, onClick, t }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [added, setAdded] = useState(false);

const handleAddToCart = async () => {
  if (isLoading) return;

  setIsLoading(true);
  const safeProduct = {
    ...product,
    createdAt: product.createdAt?.toDate
      ? product.createdAt.toDate().toISOString()
      : product.createdAt,
  };

  dispatch(addToCart(safeProduct));

  // Simulate loading (e.g., network or feedback animation)
  setTimeout(() => {
    setIsLoading(false);
    setAdded(true);

    setTimeout(() => {
        setAdded(false);
      }, 1500); // show "addedToBag" for 2 seconds
    }, 500); // spinner duration
  };

  

  return (
    <div className={`product-card loaded`} onClick={() => onClick(product)}>
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
      <button
        className="add-to-bag-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleAddToCart();
        }}
        disabled={isLoading || added}
      >
        {isLoading ? (
          <div className="spinner" />
        ) : added ? (
          <span className="text-added">{t('addedToBag')}</span>
        ) : (
          <>
            <span className="text-default">{t('buy')}</span>
            <span className="text-hover">{t('addToBag')}</span>
          </>
        )}
      </button>

    </div>
  );
};

export default ProductCard;


