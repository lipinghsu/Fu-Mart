import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../forms/Button';
import { useDispatch } from 'react-redux';
import { useTranslation } from "react-i18next";
import googleIcon from "../../assets/icons8-google-96.png";
import { googleSignInStart } from "../../redux/User/user.actions";
import './RightSideBar.scss';
import TempAd from "./TempAd";

const RightSideBar = () => {
  const { t } = useTranslation(["", "common"]);
  const [titles, setTitles] = useState([]);
  const [stop, setStop] = useState(false);
  const boxRightRef = useRef();
  const movingDivRef = useRef();
  const dispatch = useDispatch();

  const handleGoogleSignIn = () => dispatch(googleSignInStart());

  useEffect(() => {
    async function fetchTitles() {
      try {
        const res = await fetch('https://api.allorigins.win/raw?url=https://mustangnews.net/');
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const items = Array.from(doc.querySelectorAll('.entry-title a'))
        .slice(0, 3)
        .map(el => {
          const title = el.textContent.replace(/\u00A0/g, '').trim();
          const url = el.href;
          const article = el.closest('article');
          const authorLink = article?.querySelector('.author.vcard a');
          const author = authorLink ? authorLink.textContent.trim() : 'Unknown';
        //   const authorURL = 
          return { title, url, author, authorLink };
        });

        setTitles(items);
      } catch (err) {
        setTitles([{ title: err.toString(), url: '#', author: '' }]);
        console.error('Failed to fetch Mustang News titles', err);
      }
    }
    fetchTitles();
  }, []);

  const controlMovingDiv = () => {
    const bottomY = boxRightRef.current.offsetTop + boxRightRef.current.offsetHeight;
    setStop(window.scrollY + 72 > bottomY - movingDivRef.current.offsetHeight);
  };

  useEffect(() => {
    window.addEventListener("scroll", controlMovingDiv);
    return () => window.removeEventListener("scroll", controlMovingDiv);
  }, []);

  return (
    // <div className='sidebar-right-wrap'>
      <div className="sidebar-right" ref={boxRightRef}>
          <div
              className="mt-md"
              ref={movingDivRef}
              style={ stop 
              ? { position: 'sticky', top: boxRightRef.current.offsetHeight + boxRightRef.current.offsetTop - movingDivRef.current.offsetHeight }
              : { position: 'sticky', top: 74 }
              }
          >
              <div className="continue-with-social-wrap">
              <div className="title">New to Pölyfica?</div>
              <div className="subtitle">Create your account and find the best professors at Cal Poly.</div>
              <Button className="btn btn-submit btn-google" onClick={handleGoogleSignIn}>
                  <img src={googleIcon} alt="Google Icon"/> Continue with Google
              </Button>
              <div className="sub-terms">
                  By continuing, you agree to the <Link to="/terms">{t("Terms of Service")}</Link> and acknowledge our <Link to="/terms">{t("Private Policy")}</Link>.
              </div>
              </div>
          </div>
          {/* <div className='ad-wrap'>
            <TempAd/>
          </div> */}
          <div className="bot-wrap"
              ref={movingDivRef}
              style={ stop 
                  ? { position: 'sticky', top: boxRightRef.current.offsetHeight + boxRightRef.current.offsetTop - movingDivRef.current.offsetHeight }
                  : { position: 'sticky', top: 264 }
              }>
              <div className="title">
                  Top Mustang Stories
              </div>

              <div className="mustang-titles">
                  {titles.length ? (
                      titles.map(({ title, url, author, authorLink }, idx) => (
                      <div key={idx} className="entry-title">
                          <a href={url} target="_blank" rel="noopener noreferrer">
                          {title}
                          </a>
                          {/* <div className='author-wrap'>by&nbsp; */}
                          <div className='author-wrap'>
                          <a href={authorLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="author-link"
                          >
                          <div className="author-name">{author}</div>
                          </a>
                          </div>

                          
                      </div>
                      ))
                  ) : (
                      Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="entry-title skeleton">
                          <div className="skeleton-title" />
                          <div className="skeleton-author" />
                      </div>
                      ))
                  )}
              </div>

          </div>
          
          <div className="text-wrap"
                      ref={movingDivRef}
                      style={ stop 
                          ? { position: 'sticky', top: boxRightRef.current.offsetHeight + boxRightRef.current.offsetTop - movingDivRef.current.offsetHeight }
                          : { position: 'sticky', top: 493 }}>
              {/* <div className="text-wrap-inner">
                  Learn by Doing
              </div> */}
              <div className="text-wrap-inner">
                  <a href="https://www.calpoly.edu/">
                  ©&nbsp;2025 California Polytechnic State University 
                  
                  {/* © 2025 Cal Poly SLO. */}
                  {/* © 2025 California Polytechnic State University San Luis Obispo  */}
                  </a>
              </div>
          </div>
      </div>
    // </div>
  );
};

export default RightSideBar;
