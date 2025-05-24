import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './CheckOut.scss';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../assets/fu-red-bg.png';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';

const stripePromise = loadStripe('your-stripe-public-key');

const VALID_COUPONS = {
  SAVE10: 0.1,
};

const CheckOut = () => {
  const { t } = useTranslation(['checkout']);
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 870);

  const stripe = useStripe();
  const elements = useElements();
  const isDarkMode = localStorage.getItem('preferredTheme') === 'dark';

  const LIGHT_CARD_STYLE = {
    style: {
      base: {
        fontSize: '1.1rem',
        color: '#222223',
        left: '320px',
        '::placeholder': {
          color: '#828283',
        },
        fontFamily: 'Arial',
      },
      invalid: {
        color: '#e5341d',
      },
    },
  };

  const DARK_CARD_STYLE = {
    style: {
      base: {
        fontSize: '1.1rem',
        color: '#f2f2f3',
        '::placeholder': {
          color: '#999',
        },
        fontFamily: 'Arial',
      },
      invalid: {
        color: '#ff6b6b',
      },
    },
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal - subtotal * discount + taxAmount;

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 870);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setTaxRate(state === 'CA' ? 0.08 : 0.05);
  }, [state]);

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setDiscount(VALID_COUPONS[code]);
      setMessage(t('couponApplied', { code, percent: (VALID_COUPONS[code] * 100).toFixed(0) }));
    } else {
      setDiscount(0);
      setMessage(t('invalidCoupon'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    const { error, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: elements.getElement(CardElement) });
    if (!error) console.log('PaymentMethod:', paymentMethod);
    else console.log('Error:', error);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-left">
          {!isMobile && (
            <div className="checkout-logo-wrap">
              <img src={logoImage} alt="Fü-Mart" className="checkout-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
            </div>
          )}

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="section">
              <div className="section-title">{t('recipient')}</div>
              <div className="row-group first">
                <div className="input-group">
                  <input type="text" required placeholder=" " id="firstName" />
                  <label htmlFor="firstName">{t('firstName')}</label>
                </div>
                <div className="input-group">
                  <input type="text" required placeholder=" " id="lastName" />
                  <label htmlFor="lastName">{t('lastName')}</label>
                </div>
              </div>
              <div className="row-group mid A">
                <div className="input-group">
                  <input type="text" required placeholder=" " id="phone" />
                  <label htmlFor="phone">{t('phone')}</label>
                </div>
              </div>
              <div className="row-group last">
                <div className="input-group">
                  <input type="email" required placeholder=" " id="email" />
                  <label htmlFor="email">{t('email')}</label>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">{t('deliveryAddress')}</div>
              <div className="row-group first">
                <div className="input-group">
                  <input type="text" required placeholder=" " id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  <label htmlFor="address">{t('address')}</label>
                </div>
              </div>
              <div className="row-group mid A">
                <div className="input-group">
                  <input type="text" placeholder=" " id="line2" />
                  <label htmlFor="line2">{t('line2')}</label>
                </div>
              </div>
              <div className="row-group mid B">
                <div className="row-group first">
                  <div className="input-group">
                    <input type="text" required placeholder=" " id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    <label htmlFor="city">{t('city')}</label>
                  </div>
                </div>
                <div className="input-group">
                  <input type="text" required placeholder=" " id="state" value={state} onChange={(e) => setState(e.target.value)} />
                  <label htmlFor="state">{t('state')}</label>
                </div>
              </div>
              <div className="row-group last">
                <div className="input-group">
                  <input type="text" required placeholder=" " id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                  <label htmlFor="zip">{t('zip')}</label>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">{t('deliveryMethod')}</div>
              <div className="delivery-methods">
                <label>
                  <input type="radio" name="deliveryMethod" value="standard" checked={deliveryMethod === 'standard'} onChange={() => setDeliveryMethod('standard')} />
                    <span>
                        {t('standardDelivery')}
                    </span>
                    <span className='delivery-time'>
                        {t('standardDeliveryTime')}
                    </span>
                </label>
                <label>
                  <input type="radio" name="deliveryMethod" value="express" checked={deliveryMethod === 'express'} onChange={() => setDeliveryMethod('express')} />
                    <span>
                        {t('expressDelivery')}
                    </span>
                    <span className='delivery-time'>
                        {t('expressDeliveryTime')}
                    </span>
                </label>
              </div>
            </div>

            <div className="section card">
              <div className="section-title">{t('paymentInfo')}</div>
              <div className="input-group">
                <CardElement className="card-element" options={isDarkMode ? DARK_CARD_STYLE : LIGHT_CARD_STYLE} />
              </div>
            </div>

            <div className="checkout-buttons-row">
              <button type="button" className="continue-shopping-btn" onClick={() => navigate('/')}>{t('continueShopping')}</button>
              <button type="submit" className="confirm-checkout-btn">{t('confirmPurchase')}</button>
            </div>
          </form>
        </div>

        <div className="checkout-right">
          {isMobile && (
            <div className="checkout-logo-wrap">
              <img src={logoImage} alt="Fü-Mart" className="checkout-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
            </div>
          )}
          <div className="section-title">{t('orderDetails')}</div>
          {cartItems.length === 0 ? (
            <p className="empty-message">{t('emptyBag')}</p>
          ) : (
            <>
              <div className="checkout-items">
                {cartItems.map((item) => (
                  <div className="checkout-item" key={item.id}>
                    <div className="item-image">
                      <img src={item.images?.[0]} alt={item.name} />
                    </div>
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-quantity">Qty: {item.quantity}</div>
                      <div className="item-price">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="input-row coupon-row">
                <div className="input-group">
                  <input type="text" placeholder=" " id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                  <label htmlFor="coupon">{t('couponCode')}</label>
                </div>
                <button type="button" className="apply-coupon-btn" onClick={handleApplyCoupon}>{t('apply')}</button>
              </div>
              {message && (
                <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: discount ? '#28a745' : '#e5341d' }}>{message}</p>
              )}
              <div className="checkout-summary less-important">
                <div className="summary-label">{t('subtotal')}:</div>
                <div className="summary-value">${subtotal.toFixed(2)}</div>
              </div>
              <div className="checkout-summary less-important">
                <div className="summary-label">{t('tax')}:</div>
                <div className="summary-value">${taxAmount.toFixed(2)}</div>
              </div>
              {discount > 0 && (
                <div className="checkout-summary less-important discount-highlight">
                  <div className="summary-label">{t('discount')}:</div>
                  <div className="summary-value">-${(subtotal * discount).toFixed(2)}</div>
                </div>
              )}
              <div className="checkout-summary total">
                <div className="summary-label">{t('total')}:</div>
                <div className="summary-value">${totalAmount.toFixed(2)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckOutWithStripe = () => (
  <Elements stripe={stripePromise}>
    <CheckOut />
  </Elements>
);

export default CheckOutWithStripe;
