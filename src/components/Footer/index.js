import React, { useState, useEffect } from 'react';
import './Footer.scss';
import { firestore } from '../../firebase/utils'; // Ensure this points to your firebase config
import { LuArrowRight } from 'react-icons/lu';
import Button from '../forms/Button';
import ChatBot from './ChatBot'

const handlePhoneClick = () => {
  window.open(`facetime://8057561111`);
};

const Footer = () => {
  const [showPopoutBox, setShowPopoutBox] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [temp, setTemp] = useState('0');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [locationData, setLocationData] = useState(null); // Store location data
  const popoutBoxDivClass = showPopoutBox ? 'popout-box active' : 'popout-box';
  // const popoutModalDivClass = showPopoutBox ? 'popout-box-modal active' : 'popout-box-modal';
  const popoutModalDivClass = showPopoutBox ? 'popout-box-modal active' : 'popout-box-modal';

  // Function to upload location data to Firebase
  const uploadLocationData = async (locationData) => {
    const userLocationData = {
      timestamp: new Date().toISOString(),
      location: locationData,
    };

    try {
      setTemp('5');
      const userRef = await firestore.collection('userData').add(userLocationData);
      setTemp('6');
      await userRef.update({ userID: userRef.id });
      setTemp('7');
      console.log('Location data uploaded successfully');
    } catch (error) {
      console.error('Error uploading location data:', error);
    }
  };
  

  // Request location permission on page load and upload to Firebase if granted
  useEffect(() => {
    setTemp('1');
    if ('geolocation' in navigator) {
      setTemp('2');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = { latitude, longitude };
          setLocationData(locationData);
          setTemp('3');

          // Upload location data to Firebase once user allows it
          uploadLocationData(locationData);
          // setTemp('4');
        },
        (error) => {
          setTemp('error');
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  const togglePopoutBox = () => {
    setShowPopoutBox(!showPopoutBox);
  };

  const fetchUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP address:', error);
      return null;
    }
  };

  const submitFeedback = async (userIP, locationData) => {
    const feedbackData = {
      feedback: feedback,
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer,
      userIP: userIP || 'IP not available',
      timestamp: new Date().toISOString(),
      location: locationData ? locationData : 'Location not provided',
    };

    try {
      const feedbackRef = await firestore.collection('feedback').add(feedbackData);
      await feedbackRef.update({ feedbackID: feedbackRef.id });
      setFeedbackSubmitted(true);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();

    const userIP = await fetchUserIP();
    submitFeedback(userIP, locationData);
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-column">
          <div className="column-title">
            Campus Info
          </div>
          <ul>
            <h2 className="phone-number contact-info">
              <a href="#" onClick={handlePhoneClick}>(805) 756-1111</a>
            </h2>
            <h2 className="contact-info">
              <a href="https://www.calpoly.edu/">
                <span className="yellow-text">CAL</span>IFORNIA
                <br />
                <span className="yellow-text">POLY</span>TECHNIC <br />STATE UNIVERSITY
              </a>
            </h2>
            <h2 className="contact-info">
              <a href="https://www.google.com/maps/dir//California+Polytechnic+State+University,+1+Grand+Ave,+San+Luis+Obispo,+CA+93407/data=!4m7!4m6!1m1!4e2!1m2!1m1!1s0x80ecf1b4054c3551:0x98b3b48a29d99103!3e0?sa=X&ved=2ahUKEwj-wP-484-EAxWjKkQIHSS_C90Q-A96BAggEAA">
                1 GRAND AVENUE <br />
                <span className="yellow-text">SAN LUIS OBISPO</span>, CA 93407
              </a>
            </h2>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="column-title">Quick Links</h4>
          <ul>
            <h2 className="quick-links">
              <a href="https://maps.calpoly.edu/">CAL POLY MAPS</a>
            </h2>
            <h2 className="quick-links">
              <a href="https://mustangnews.net/">MUSTANG NEWS</a>
            </h2>
            <h2 className="quick-links">
              <a href="https://myportal.calpoly.edu/">CAL POLY PORTAL</a>
            </h2>
            <h2 className="quick-links">
              <a href="https://www.calpoly.edu/">UNIVERSITY HOME</a>
            </h2>
            <h2 className="quick-links">
              <a href="https://magazine.calpoly.edu/">CAL POLY MAGAZINE</a>
            </h2>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="column-title">Feedback</h4>
          <form onSubmit={handleFeedbackSubmit} className="feedback-form">
            <textarea
              className="feedback-textarea"
              placeholder={feedbackSubmitted ? 'THANKS FOR THE FEEDBACK!' : 'TELL US WHAT YOU THINK!'}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />

            <Button className="submit-button" type="submit">
              <LuArrowRight className="arrow-icon" />
            </Button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="bottom-top-wrap">
          <div className={popoutBoxDivClass} onClick={togglePopoutBox}>
            <p>{showPopoutBox ? 'CLOSE' : 'HELP'}</p>
          </div>

          <div className={popoutModalDivClass}>
            <ChatBot 
              setShowPopoutBox={setShowPopoutBox}
              showPopoutBox={showPopoutBox}
            />
          </div>

          <div className="polySeal-container">
            <div className="polySeal-image" />
          </div>
        </div>

        <div className="text-container">
          <p className="copy-right">&copy; 2025 Cal Poly SLO</p>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
