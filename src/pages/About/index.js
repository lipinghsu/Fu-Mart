import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import horseVideo from './../../assets/x4j9w3.mp4';
import einsteinVideo from './../../assets/k1m0b4.mp4';
import beeVideo from './../../assets/s7t8n2.mp4';
import './styles.scss';

const About = () => {
    const { t } = useTranslation(["about"]);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            video: horseVideo,
            heading: t("Reliable, student-driven reviews"),
            text: t("Transform the way Cal Poly students choose their professors"),
            alt: "",
        },
        {
            video: einsteinVideo,
            heading: t("Brilliant, valuable, and insightful"),
            text: t("More trusted than any other professor rating site at Cal Poly"),
            alt: "Video of Einstein",
        },
        {
            video: beeVideo,
            heading: t("Discover professors who genuinely inspire you"),
            text: t("Find the one that makes your Cal Poly experience unforgettable"),
            alt: "Video of Dexter building",
        },
    ];

    // reset to start of the video which are proloaded with map().
    useEffect(() => {
        const videos = document.querySelectorAll('.about-video');
        videos.forEach((video, index) => {
            if (index === currentSlide) {
                video.currentTime = 0;  
                video.play();
            }
        });
    }, [currentSlide]);

    // video paly time
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
        }, 5000); // 5 seconds

        return () => clearInterval(interval); // cleanup
    }, [slides.length]);

    return (
        <section className='about'>
            <div className='about-wrap'>
            <div className="image-container">
                {slides.map((slide, index) => (
                    <video
                        key={index}
                        src={slide.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`about-video ${index === currentSlide ? 'active' : ''}`}
                    />
                ))}
                <div className="text-wrap" key={currentSlide}>
                    <div className="heading">{slides[currentSlide].heading}</div>
                    <div className="heading-text">{slides[currentSlide].text}</div>
                </div>
            </div>
            </div>
        </section>
    );
};

export default About;
