import { useRef } from "react";
import React from 'react';
import Directory from '../../components/Directory';
import TopReviews from '../../components/TopReviews';
import SiteStats from '../../components/SiteStats';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import About from '../../pages/About';
import './styles.scss';
import {
    SnapList,
    SnapItem,
    useVisibleElements,
    useScroll,
  } from 'react-snaplist-carousel';



const Homepage = ({ showSignupDropdown, setShowSignupDropdown }) => {
    const scrollRef = useRef(null);
    return (
        <section className='homepage' >
                <Directory showSignupDropdown={showSignupDropdown} />
                <TopReviews />
        </section>
    );
};

export default Homepage;
