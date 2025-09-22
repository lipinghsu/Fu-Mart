import React, { useState } from 'react';
// import Header from './../components/Header';
// import Footer from '../components/Footer';
// import MainFooter from '../components/Footer/MainFooter';
// import addImage from '../assets/add_image.png'
import './styles.scss';

const MainLayout = props =>{
    return(
        <div className='flex-wrapper-main-layout'>

            <div className="main-layout-wrap">
                {props.children}
            </div>

        </div>
    );
};

export default MainLayout;