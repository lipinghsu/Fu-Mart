import React, { useState } from 'react';
// import Header from '../components/Header';
// import Footer from '../components/Footer';
// import Directory from '../components/Directory';
import './styles.scss';

const HomepageLayout = (props) => {
    const [showSignupDropdown, setShowSignupDropdown] = useState(false);

    return (
        <div className=''>
            {/* <Header 
                {...props} 
                showSignupDropdown={showSignupDropdown} 
                setShowSignupDropdown={setShowSignupDropdown} 
                homepageHeader={true}
            /> */}
            {React.cloneElement(props.children, { showSignupDropdown, setShowSignupDropdown })}
            {/* <Footer /> */}
        </div>
    );
};

export default HomepageLayout;