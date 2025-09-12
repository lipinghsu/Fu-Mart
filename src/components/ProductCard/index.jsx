import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import './ProductCard.scss';

const ProductCard = ({ product, onClick, t }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const stockQty = Number(product?.stockQuantity ?? 0);
  const isSoldOut = stockQty <= 0;

  // --- On Sale logic (priceDiscount is an amount off) ---
  const price = typeof product?.price === 'number' ? product.price : Number(product?.price ?? 0);
  const discount = Number(product?.priceDiscount ?? 0);
  const isOnSale = !isSoldOut && price > 0 && discount > 0;
  const finalPrice = isOnSale ? Math.max(price - discount, 0) : price;
  const percentOff = isOnSale && price > 0 ? Math.round((discount / price) * 100) : null;

  const handleAddToCart = async () => {
    if (isLoading || isSoldOut) return;

    setIsLoading(true);
    const safeProduct = {
      ...product,
      createdAt: product?.createdAt?.toDate
        ? product.createdAt.toDate().toISOString()
        : product.createdAt,
    };

    dispatch(addToCart(safeProduct));

    setTimeout(() => {
      setIsLoading(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }, 1000);
  };

  return (
    <div
      className={`product-card loaded ${isSoldOut ? 'sold-out' : ''} ${isOnSale ? 'on-sale' : ''}`}
      onClick={() => onClick(product)}
      aria-label={
        isSoldOut ? (t?.('soldOut') || 'Sold Out')
        : isOnSale ? `${product?.name} ${t?.('onSale') || 'On Sale'}`
        : product?.name
      }
      data-soldout={isSoldOut}
      data-onsale={isOnSale}
    >
      {product.images?.[0] && (
        <div className="product-image-wrap">
          <img
            src={product.images[0]}
            alt={product.name}
            className="product-image"
          />
          {isSoldOut && <div className="sold-out-overlay" aria-hidden="true" />}
          {/* {isSoldOut && (
            <div className="sold-out-badge">
              {t?.('soldOut') || 'Sold Out'}
            </div>
          )} */}
          {/* {isOnSale && !isSoldOut && (
            <div className="sale-badge" aria-hidden="true">
              {percentOff ? `-${percentOff}%` : (t?.('sale') || 'SALE')}
            </div>
          )} */}
        </div>
      )}

      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <p className="subtitle">{product.subtitle}</p>

        <p className="price">
          {isOnSale ? (
            <>
              <span className="current isOnSale">${finalPrice.toFixed(2)}</span>
              <span className="original isOnSale">${price.toFixed(2)}</span>
              {/* {percentOff ? <span className="percent">{percentOff}% OFF</span> : null} */}
            </>
          ) : (
            <span className="current">
              {typeof price === 'number' && !Number.isNaN(price) ? `$${price.toFixed(2)}` : '--'}
            </span>
          )}
        </p>
      </div>

      <button
        className={`add-to-bag-btn ${isSoldOut ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handleAddToCart();
        }}
        disabled={isLoading || added || isSoldOut}
        aria-disabled={isLoading || added || isSoldOut}
        title={
          isSoldOut ? (t?.('soldOut') || 'Sold Out')
          : isOnSale ? (t?.('onSale') || 'On Sale')
          : undefined
        }
      >
        {isSoldOut ? (
          <span className="text-soldout">{t?.('soldOut') || 'Sold Out'}</span>
        ) : isLoading ? (
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
