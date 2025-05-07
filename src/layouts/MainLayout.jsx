import React, { useState } from 'react';
// import Header from './../components/Header';
// import Footer from '../components/Footer';
// import MainFooter from '../components/Footer/MainFooter';
// import addImage from '../assets/add_image.png'
import './styles.scss';

const MainLayout = props =>{
    const [showSignupDropdown, setShowSignupDropdown] = useState(false);
    return(
        <div className='flex-wrapper-main-layout'>
            {/* <Header
                {...props} 
                showSignupDropdown={showSignupDropdown} 
                setShowSignupDropdown={setShowSignupDropdown} 
                mainHeader={true}
            /> */}
            <div className="main-layout-wrap">
                {props.children}
            </div>

            {/* button to write a new review */}
            {/* <div className="button">
                <img src={addImage}/>
            </div> */}
            {/* <MainFooter/> */}
        </div>
    );
};

export default MainLayout;