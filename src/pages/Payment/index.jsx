import React from "react";
import CheckOut from "../../components/CheckOut";
// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
// import { publishableKey } from './../../stripe/config';

// const stripePromise = loadStripe(publishableKey);
const stripePromise = "";

const Payment = () => {
    return(
        <div>
            <CheckOut />
        </div>
    );
}

export default Payment;