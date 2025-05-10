import React, { useState } from 'react';
// import Header from '../components/Header';
// import Footer from '../components/Footer';
// import Directory from '../components/Directory';
import './styles.scss';

const HomepageLayout = (props) => {
    const [showSignupDropdown, setShowSignupDropdown] = useState(false);

    return (
        <div className=''>
            {React.cloneElement(props.children, { showSignupDropdown, setShowSignupDropdown })}
        </div>
    );
};

export default HomepageLayout;