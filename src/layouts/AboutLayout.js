import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './styles.scss';

const AboutLayout = props =>{
    const [showSignupDropdown, setShowSignupDropdown] = useState(false);
    return(
        <div className='flex-wrapper-about-layout'>
            <Header
                {...props} 
                showSignupDropdown={showSignupDropdown} 
                setShowSignupDropdown={setShowSignupDropdown} 
                aboutpageHeader={true}
            />
            <div className="about-wrap">
                {props.children}
            </div>
            <Footer />
        </div>
    );
};

export default AboutLayout;