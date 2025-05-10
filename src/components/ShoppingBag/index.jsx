import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { increaseQuantity, decreaseQuantity } from '../../redux/cartSlice';
import closeImage from './../../assets/closeImage.png';
import './ShoppingBag.scss';

const ShoppingBag = ({ isCartOpen, setIsCartOpen }) => {
  const { t } = useTranslation('cart'); // points to your translation namespace
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const [drawerState, setDrawerState] = useState('closed'); // 'opening', 'closing', 'closed'

  useEffect(() => {
    if (isCartOpen) {
      setDrawerState('opening');
    } else if (drawerState === 'opening') {
      setDrawerState('closing');
      setTimeout(() => {
        setDrawerState('closed');
      }, 600); // match closing animation duration
    }
  }, [isCartOpen]);

  return (
    <>
      <div className={`cart-drawer ${drawerState}`}>
        <div className="cart-drawer-header">
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
              <div key={index} className="cart-item">
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
            ))
          )}
        </div>

        <div className="cart-drawer-footer">
          <div className="total-amount">
            {t('grandTotal')}: ${totalAmount.toFixed(2)}
          </div>
          <button className="checkout-btn">{t('proceedToCheckout')}</button>
        </div>
      </div>

      <div
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
      />
    </>
  );
};

export default ShoppingBag;
