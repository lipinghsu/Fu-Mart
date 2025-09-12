// src/components/ShoppingBag/ShoppingBag.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  clearCart
} from '../../redux/cartSlice';
import closeImage from './../../assets/Icons/closeImage.png';
import ConfirmDialog from '../ConfirmDialog';
import './ShoppingBag.scss';

const ShoppingBag = ({ isCartOpen, setIsCartOpen }) => {
  const { t } = useTranslation('cart');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector(state => state.cart.items);

  const [scrolled, setScrolled] = useState(false);
  const [drawerState, setDrawerState] = useState('closed');

  const [confirmType, setConfirmType] = useState(null);
  const [targetItemId, setTargetItemId] = useState(null);

  const [isDraggingItem, setIsDraggingItem] = useState(false);

  // NEW: calculate total item count
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isCartOpen) {
      setDrawerState('opening');
    } else if (drawerState === 'opening') {
      setDrawerState('closing');
      setTimeout(() => setDrawerState('closed'), 300);
    }
  }, [isCartOpen, drawerState]);

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  const handleConfirm = () => {
    if (confirmType === 'clear') {
      dispatch(clearCart());
    } else if (confirmType === 'remove' && targetItemId) {
      dispatch(removeItem(targetItemId));
    }
    setConfirmType(null);
    setTargetItemId(null);
  };
  const handleCancel = () => {
    setConfirmType(null);
    setTargetItemId(null);
  };

  const handleOverlayDrop = e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) dispatch(removeItem(id));
    setIsDraggingItem(false);
  };

  const handleDragLeaveOverlay = e => {
    setIsDraggingItem(false);
  };

  return (
    <>
      <div className={`cart-drawer ${drawerState}`}>
        <div className={`cart-drawer-header ${scrolled ? 'scrolled' : ''}`}>
          {/* Bag Title with Total Items */}
          <h2 className="shopping-bag-title">
            {t('shoppingBag')} 
            {totalItemsCount > 0 && (
              <span className="item-count">
                &nbsp;({totalItemsCount} {t(totalItemsCount === 1 ? 'item' : 'items')})
              </span>
            )}
          </h2>
          <div className="close-btn" onClick={() => setIsCartOpen(false)}>
            <img src={closeImage} alt={t('close')} />
          </div>
        </div>

        <div className={`cart-drawer-body ${cartItems.length === 0 ? 'empty' : ''}`}>
          {cartItems.length === 0 ? (
            <p>{t('emptyMessage')}</p>
          ) : (
            cartItems.map(item => (
              <div
                key={item.id}
                className="cart-item-wrapper"
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', item.id);
                  setIsDraggingItem(true);
                }}
                onDragEnd={() => setIsDraggingItem(false)}
              >
                <div className="button-wrapper">
                  <div
                    className="remove-item-btn"
                    onClick={() => {
                      setConfirmType('remove');
                      setTargetItemId(item.id);
                    }}
                  >
                    <img src={closeImage} alt="Remove" />
                  </div>
                </div>

                <div className="cart-item">
                  <div className="item-image">
                    <img src={item.images[0]} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <div className="item-name">{item.name}</div>
                    <div className="item-unit-price">
                      {t('unitPrice')}: ${item.price.toFixed(2)}
                    </div>
                    <div className="item-total-price">
                      {t('total')}: ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="item-quantity-controls">
                    <div
                      className="bag-quantity-control btn"
                      onClick={() => dispatch(increaseQuantity(item.id))}
                    >
                      +
                    </div>
                    <div className="bag-quantity-control">{item.quantity}</div>
                    <div
                      className="bag-quantity-control btn"
                      onClick={() => dispatch(decreaseQuantity(item.id))}
                    >
                      –
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-drawer-footer">
          {totalItemsCount > 0 && (
            <div
              className="checkout-text"
            >
              {t('checkoutNote')}
            </div>
          )}

          <button
            className="checkout-btn"
            disabled={cartItems.length === 0}
            onClick={() => {
              if (cartItems.length > 0) {
                setIsCartOpen(false);
                navigate('/checkout');
              }
            }}
          >
            <span>{t('proceedToCheckout')}</span>
            <span>${totalAmount.toFixed(2)}</span>
          </button>

          
        </div>
      </div>

      <div
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleOverlayDrop}
        onDragLeave={handleDragLeaveOverlay}
      >
        {isDraggingItem && (
          <div className="trashcan-indicator">
            Remove
          </div>
        )}
      </div>

      {confirmType && (
        <ConfirmDialog
          message={t(confirmType === 'clear' ? 'confirmClear' : 'confirmRemove')}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default ShoppingBag;
