import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { auth, firestore } from '../../firebase/utils';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { FieldValue, writeBatch, doc, getDoc } from 'firebase/firestore';
import { clearCart as clearCartAction } from '../../redux/cartSlice';
import './CheckOut.scss';
import logoImage from '../../assets/fu-red-bg.png';

const stripePromise = loadStripe('your-stripe-public-key');

const VALID_COUPONS = {
  SAVE10: 0.1
};

const CheckOut = () => {
  const { t } = useTranslation(['checkout']);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [zip, setZip] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 870);

  const stripe = useStripe();
  const elements = useElements();
  const isDarkMode = localStorage.getItem('preferredTheme') === 'dark';


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const LIGHT_CARD_STYLE = {
    style: {
      base: {
        fontSize: '1.1rem',
        color: '#222223',
        '::placeholder': {
          color: '#828283'
        },
        fontFamily: 'Arial'
      },
      invalid: {
        color: '#e5341d'
      }
    }
  };

  const DARK_CARD_STYLE = {
    style: {
      base: {
        fontSize: '1.1rem',
        color: '#f2f2f3',
        '::placeholder': {
          color: '#888'
        },
        fontFamily: 'Arial'
      },
      invalid: {
        color: '#ff6b6b'
      }
    }
  };

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal - subtotal * discount + taxAmount;

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 870);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // If stateProvince is “CA” use 8%, otherwise use 5%
    setTaxRate(stateProvince === 'CA' ? 0.08 : 0.05);
  }, [stateProvince]);

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setDiscount(VALID_COUPONS[code]);
      setMessage(
        t('couponApplied', {
          code,
          percent: (VALID_COUPONS[code] * 100).toFixed(0)
        })
      );
    } else {
      setDiscount(0);
      setMessage(t('invalidCoupon'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;
    if (!currentUser) return;

    let clientSecret;
    try {
      const response = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // in cents
          currency: 'usd'
        })
      });
      const { clientSecret: secret } = await response.json();
      clientSecret = secret;
    } catch (err) {
      console.error('Error creating PaymentIntent:', err);
      setMessage(t('paymentError'));
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { paymentIntent, error } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: { card: cardElement }
      }
    );

    if (error || paymentIntent.status !== 'succeeded') {
      console.error('Stripe confirmation error:', error);
      setMessage(t('paymentError'));
      return;
    }

    // Payment succeeded → update Firestore stockQuantity
    try {
      const batch = writeBatch(firestore);
      cartItems.forEach((item) => {
        const productRef = doc(firestore, 'products', item.id);
        batch.update(productRef, {
          stockQuantity: FieldValue.increment(-item.quantity)
        });
      });
      await batch.commit();
      console.log('🟢 Stock quantities updated.');

      dispatch(clearCartAction());
      navigate('/order-confirmation');
    } catch (updateError) {
      console.error('Error updating stockQuantity:', updateError);
      setMessage(t('stockUpdateError'));
      return;
    }
  };

  return (
    <div className={`checkout-page ${!currentUser ? 'not-logged-in' : ''}`}>
      <div className="checkout-card">
        <div className="checkout-left">
          {!isMobile && (
            <div className="checkout-logo-wrap">
              <img
                src={logoImage}
                alt="Fü-Mart"
                className="checkout-logo"
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer' }}
              />
            </div>
          )}

          <form className="checkout-form" onSubmit={handleSubmit}>
            {/* ─── Login / Sign‐Up Banner ─── */}
            {!currentUser && (
              <div className="login-banner">
                <p className="login-text">
                  {t('login-text')}
                </p>
                <div className="login-buttons">
                  <button
                    type="button"
                    className="login-btn"
                    onClick={() => navigate('/login')}
                  >
                    {t('login') || 'Log In'}
                  </button>
                  <button
                    type="button"
                    className="signup-btn"
                    onClick={() => navigate('/signup')}
                  >
                    {t('signup') || 'Sign Up'}
                  </button>
                </div>
              </div>
            )}

            {/* ─── Recipient Section ─── */}
            <div className="section">
              <div className="section-title">{t('recipient')}</div>
              {currentUser ? (
                <>
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
                </>
              ) : null}
            </div>

            {/* ─── Delivery Address Section ─── */}
            <div className="section">
              <div className="section-title">{t('deliveryAddress')}</div>
              {currentUser ? (
                <>
                  <div className="row-group first">
                    <div className="input-group">
                      <input
                        type="text"
                        required
                        placeholder=" "
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
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
                        <input
                          type="text"
                          required
                          placeholder=" "
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                        <label htmlFor="city">{t('city')}</label>
                      </div>
                    </div>
                    <div className="input-group">
                      <input
                        type="text"
                        required
                        placeholder=" "
                        id="state"
                        value={stateProvince}
                        onChange={(e) => setStateProvince(e.target.value)}
                      />
                      <label htmlFor="state">{t('state')}</label>
                    </div>
                  </div>
                  <div className="row-group last">
                    <div className="input-group">
                      <input
                        type="text"
                        required
                        placeholder=" "
                        id="zip"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                      <label htmlFor="zip">{t('zip')}</label>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* ─── Delivery Method Section ─── */}
            <div className="section">
              <div className="section-title">{t('deliveryMethod')}</div>
              {currentUser ? (
                <div className="delivery-methods">
                  <label>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="standard"
                      checked={deliveryMethod === 'standard'}
                      onChange={() => setDeliveryMethod('standard')}
                    />
                    <span>{t('standardDelivery')}</span>
                    <span className="delivery-time">
                      {t('standardDeliveryTime')}
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="express"
                      checked={deliveryMethod === 'express'}
                      onChange={() => setDeliveryMethod('express')}
                    />
                    <span>{t('expressDelivery')}</span>
                    <span className="delivery-time">
                      {t('expressDeliveryTime')}
                    </span>
                  </label>
                </div>
              ) : null}
            </div>

            {/* ─── Payment Info Section ─── */}
            <div className="section card">
              <div className="section-title">{t('paymentInfo')}</div>
              {currentUser ? (
                <div className="input-group">
                  <CardElement
                    className="card-element"
                    options={isDarkMode ? DARK_CARD_STYLE : LIGHT_CARD_STYLE}
                  />
                </div>
              ) : null}
            </div>

            {message && (
              <p
                style={{
                  fontSize: '0.9rem',
                  marginBottom: '16px',
                  color: '#e5341d'
                }}
              >
                {message}
              </p>
            )}

            <div className="checkout-buttons-row">
              <button
                type="button"
                className="continue-shopping-btn"
                onClick={() => navigate('/')}
              >
                {t('continueShopping')}
              </button>
              <button
                type="submit"
                className="confirm-checkout-btn"
                disabled={!currentUser}
              >
                {t('confirmPurchase')}
              </button>
            </div>
          </form>
        </div>

        <div className="checkout-right">
          {isMobile && (
            <div className="checkout-logo-wrap">
              <img
                src={logoImage}
                alt="Fü-Mart"
                className="checkout-logo"
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer' }}
              />
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
                      <div className="item-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="input-row coupon-row">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder=" "
                    id="coupon"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    disabled={!currentUser}
                  />
                  <label htmlFor="coupon">{t('couponCode')}</label>
                </div>
                <button
                  type="button"
                  className="apply-coupon-btn"
                  onClick={handleApplyCoupon}
                  disabled={!currentUser}
                >
                  {t('apply')}
                </button>
              </div>

              {discount > 0 && (
                <div className="checkout-summary less-important discount-highlight">
                  <div className="summary-label">{t('discount')}:</div>
                  <div className="summary-value">
                    -${(subtotal * discount).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="checkout-summary less-important">
                <div className="summary-label">{t('subtotal')}:</div>
                <div className="summary-value">${subtotal.toFixed(2)}</div>
              </div>
              <div className="checkout-summary less-important">
                <div className="summary-label">{t('tax')}:</div>
                <div className="summary-value">${taxAmount.toFixed(2)}</div>
              </div>
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
