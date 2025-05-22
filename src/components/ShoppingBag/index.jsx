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
import closeImage from './../../assets/closeImage.png';
import ConfirmDialog from '../ConfirmDialog'; 
import './ShoppingBag.scss';

const ShoppingBag = ({ isCartOpen, setIsCartOpen }) => {
  const { t } = useTranslation('cart');
  const cartItems = useSelector((state) => state.cart.items);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const [drawerState, setDrawerState] = useState('closed');

  // Confirm dialog states
  const [confirmType, setConfirmType] = useState(null);
  const [targetItemId, setTargetItemId] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isCartOpen) {
      setDrawerState('opening');
    } else if (drawerState === 'opening') {
      setDrawerState('closing');
      setTimeout(() => setDrawerState('closed'), 600);
    }
  }, [isCartOpen]);

  const handleConfirm = () => {
    if (confirmType === 'clear') {
      dispatch(clearCart());
    } else if (confirmType === 'remove' && targetItemId !== null) {
      dispatch(removeItem(targetItemId));
    }
    setConfirmType(null);
    setTargetItemId(null);
  };

  const handleCancel = () => {
    setConfirmType(null);
    setTargetItemId(null);
  };

  return (
    <>
      <div className={`cart-drawer ${drawerState}`}>
        <div className={`cart-drawer-header ${scrolled ? 'scrolled' : ''}`}>
          <h2>{t('shoppingBag')}</h2>
          <div className="close-btn" onClick={() => setIsCartOpen(false)}>
            <img src={closeImage} alt={t('close')} />
          </div>
        </div>

        <div className={`cart-drawer-body ${cartItems.length === 0 ? 'empty' : ''}`}>
          {cartItems.length === 0 ? (
            <p>{t('emptyMessage')}</p>
          ) : (
            cartItems.map((item, index) => (
              <div key={index} className="cart-item-wrapper">
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
          {cartItems.length > 0 && (
            <>
              {/* <button
                className="clear-cart-btn"
                onClick={() => setConfirmType('clear')}
              >
                {t('clearBag') || 'Clear Bag'}
              </button> */}
              <button
                className="checkout-btn"
                onClick={() => {
                  setIsCartOpen(false); // optional: close cart first
                  navigate('/checkout'); // replace with your actual checkout route
                }}
              >
                <span>{t('proceedToCheckout')}</span>
                <span>${totalAmount.toFixed(2)}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
      />

      {confirmType && (
        <ConfirmDialog
          message={
            t(confirmType === 'clear' ? 'confirmClear' : 'confirmRemove')
          }
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default ShoppingBag;
