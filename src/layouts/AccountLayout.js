import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './styles.scss';

const AccountLayout = props =>{
    const [showSignupDropdown, setShowSignupDropdown] = useState(false);
    return(
        <div className='flex-wrapper-account-layout'>
            <Header {...props}
                    showSignupDropdown={showSignupDropdown} 
                    setShowSignupDropdown={setShowSignupDropdown} />
            <div className="main-account">
                {props.children}
            </div>
            <Footer />
        </div>
    );
};

export default AccountLayout;