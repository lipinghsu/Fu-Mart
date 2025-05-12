import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const CartSync = () => {
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  return null; // this component doesn't render anything
};

export default CartSync;