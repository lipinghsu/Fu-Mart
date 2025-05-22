import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './CheckOut.scss';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../assets/fu-red-bg.png';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('your-stripe-public-key');

const VALID_COUPONS = {
  SAVE10: 0.1,
};

const CheckOut = () => {
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

  const stripe = useStripe();
  const elements = useElements();

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal - subtotal * discount + taxAmount;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (state === 'CA') {
      setTaxRate(0.08);
    } else {
      setTaxRate(0.05);
    }
  }, [state]);

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setDiscount(VALID_COUPONS[code]);
      setMessage(`"${code}" applied. You saved ${(VALID_COUPONS[code] * 100).toFixed(0)}%!`);
    } else {
      setDiscount(0);
      setMessage('Invalid coupon code.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (!error) {
      console.log('PaymentMethod:', paymentMethod);
    } else {
      console.log('Error:', error);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-left">
          <div className="checkout-logo-wrap">
            <img
              src={logoImage}
              alt="Fü-Mart"
              className="checkout-logo"
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            />
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="section">
              <div className="section-title">Recipient</div>
              <div className="row-group first">
                <div className="input-group">
                  <input type="text" required placeholder=" " id="firstName" />
                  <label htmlFor="firstName">First Name</label>
                </div>
                <div className="input-group">
                  <input type="text" required placeholder=" " id="lastName" />
                  <label htmlFor="lastName">Last Name</label>
                </div>
              </div>
              <div className="row-group mid A">
                <div className="input-group">
                  <input type="text" required placeholder=" " id="phone" />
                  <label htmlFor="phone">Phone Number</label>
                </div>
              </div>
              <div className="row-group last">
                <div className="input-group">
                  <input type="email" required placeholder=" " id="email" />
                  <label htmlFor="email">Email Address</label>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Delivery Address</div>
              <div className="row-group first">
                <div className="input-group">
                  <input type="text" required placeholder=" " id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  <label htmlFor="address">Address</label>
                </div>
              </div>

              <div className="row-group mid A">
                <div className="input-group">
                  <input type="text" placeholder=" " id="line2" />
                  <label htmlFor="line2">Apartment, suite, etc. (optional)</label>
                </div>
              </div>


              <div className="row-group mid B">
                <div className="row-group first">
                  <div className="input-group">
                    <input type="text" required placeholder=" " id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    <label htmlFor="city">City</label>
                  </div>
                </div>

                <div className="input-group">
                  <input type="text" required placeholder=" " id="state" value={state} onChange={(e) => setState(e.target.value)} />
                  <label htmlFor="state">State</label>
                </div>
              </div>

              <div className="row-group last">
                <div className="input-group">
                  <input type="text" required placeholder=" " id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                  <label htmlFor="zip">ZIP Code</label>
                </div>
              </div>

            </div>

            <div className="section">
              <div className="section-title">Delivery Method</div>
              <div className="delivery-methods">
                <label>
                  <input type="radio" name="deliveryMethod" value="standard" checked={deliveryMethod === 'standard'} onChange={() => setDeliveryMethod('standard')} />
                  Standard Delivery (3–5 business days)
                </label>
                <label>
                  <input type="radio" name="deliveryMethod" value="express" checked={deliveryMethod === 'express'} onChange={() => setDeliveryMethod('express')} />
                  Express Delivery (1–2 business days)
                </label>
              </div>
            </div>

            <div className="section card">
              <div className="section-title">Payment Information</div>
              <div className="input-group">
                <CardElement className="card-element" />
              </div>
            </div>

            <div className="checkout-buttons-row">
              <button type="button" className="continue-shopping-btn" onClick={() => navigate('/')}>
                Continue Shopping
              </button>
              <button type="submit" className="confirm-checkout-btn">
                Confirm Purchase
              </button>
            </div>
          </form>
        </div>

        <div className="checkout-right">
          <div className="section-title">Order Details</div>
          {cartItems.length === 0 ? (
            <p className="empty-message">Your shopping bag is empty.</p>
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
                  <input
                    type="text"
                    placeholder=" "
                    id="coupon"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <label htmlFor="coupon">Coupon Code</label>
                </div>
                <button type="button" className="apply-coupon-btn" onClick={handleApplyCoupon}>
                  Apply
                </button>
              </div>

              {message && (
                <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: discount ? '#28a745' : '#e5341d' }}>
                  {message}
                </p>
              )}

              <div className="checkout-summary less-important">
                <div className="summary-label">Subtotal:</div>
                <div className="summary-value">${subtotal.toFixed(2)}</div>
              </div>
              <div className="checkout-summary less-important">
                <div className="summary-label">Tax:</div>
                <div className="summary-value">${taxAmount.toFixed(2)}</div>
              </div>

              {discount > 0 && (
                <div className="checkout-summary less-important discount-highlight">
                  <div className="summary-label">Discount:</div>
                  <div className="summary-value">-${(subtotal * discount).toFixed(2)}</div>
                </div>
              )}

              <div className="checkout-summary total">
                <div className="summary-label">Total:</div>
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
