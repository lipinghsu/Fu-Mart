import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AboutUs.scss';
import Footer from './../Footer';
import Header from './../Header';
import heroImg from '../../assets/Images/hero-img.png';

import storyImg from '../../assets/Images/story-img.png';
import EthosImg from '../../assets/Images/ethos-img.png';
import visionImg from '../../assets/Images/vision-img.png';

// import letterImg from '../../assets/Images/letter-img.png';

const AboutUs = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['about', 'common']);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('preferredTheme');
    return savedTheme === 'dark';
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark-mode', newMode);
    localStorage.setItem('preferredTheme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observerOptions = { threshold: 0.05 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.about-section .image, .about-section .text');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  return (
    <div className="about-page">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        // mainPageHeader = {true}
      />

      {/* Hero Section */}
      <section className="hero-section">
        <img src={heroImg} alt="Hero" className="hero-image" />
        <div className="hero-overlay">
          <h1>{t('hero.title', '關於我們')}</h1>
        </div>
      </section>

      {/* Preface */}
      <section className="preface-section">
        <div className="text">
          <h2>{t('preface.title', '重新塑造台北市的消費體驗')}</h2>
          <p>
            {t(
              'preface.p1',
              '我們的目標是把台北的商品和服務重新整合，打造出一台能連接整座城市的 「數位自動販賣機」 。把各地店家的好貨用藝術品的方式呈現，讓大家能快速尋找到精緻的商品和最棒的服務。'
            )}
          </p>
          <p>
            {t(
              'preface.p2',
              '把生活的細節做到極致，讓平凡也能成為一種感官的享受，讓台北的購物體驗更精緻獨特、更有效率。'
            )}
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="about-section reverse">
        <div className="text">
          <h2>{t('founder.title', '創辦人背景')}</h2>
          <p>
            {t(
              'founder.p1',
              '出生於 90 年代的台北市，立平在高中時獨自前往加州，與早幾年移居當地的哥哥一起生活。 他的第一份工作是在美國的華人超市 99 Ranch Market 擔任收銀員。'
            )}
          </p>
          <p>
            {t(
              'founder.p2',
              '剛到美國的期間，他靠著聽饒舌音樂學英文，把自己沈浸在未曾接觸過的次文化裡， 逐漸學會用不同的角度觀察世界。'
            )}
          </p>
          <p>{t('founder.p3', '之後，他在加州理工州立大學完成了電腦工程學位。')}</p>
        </div>
        <div className="image about">
          <img src={storyImg} alt="Our story" />
        </div>
      </section>

      {/* Ethos Section */}
      <section className="about-section">
        <div className="text">
          <h2>{t('ethos.title', '美學的根源')}</h2>
          <p>
            {t(
              'ethos.p1',
              '立平的爺爺奶奶是在二戰後移居台灣的外省人，家中掛滿用朱紅色印章點綴的墨水畫與竹木製成的中式家具；奶奶手腕那枚的綠色玉鐲，成為他對中國文化最早的認知。'
            )}
          </p>
          <p>
            {t(
              'ethos.p2',
              '這些日常畫面醞釀出他對中華美學的理解， 也奠定了 Fü-Mart 在品牌設計與精神上延續傳統與將其發展創新的理念。'
            )}
          </p>
          <p>
            {t(
              'ethos.p3',
              '這是一種根植於中華文化的自信與驕傲， 也是我們持續前行的動力。'
            )}
          </p>
        </div>
        <div className="image">
          <img src={EthosImg} alt="Our ethos" />
        </div>
      </section>

      {/* Vision Section */}
      <section className="about-section reverse">
        <div className="text">
          <h2>{t('vision.title', '我們的願景')}</h2>
          <p>
            {t(
              'vision.p1',
              '第一個目標是創造出一個能讓臺北人自由交流與分享的平台， 讓每個人都能輕鬆快速的找到心儀又獨特的商品。'
            )}
          </p>
          <p>
            {t(
              'vision.p2',
              '也希望能夠推廣並且製作出高品質的臺北在地產品，讓這座城市的美從這裡一點一滴地向外擴散。'
            )}
          </p>
          <p>
            {t(
              'vision.p3',
              '也希望能夠推廣並且製作出高品質的臺北在地產品，讓這座城市的美從這裡一點一滴地向外擴散。'
            )}
          </p>
        </div>
        <div className="image">
          <img src={visionImg} alt="Our vision" />
        </div>
      </section>

      {/* Join Section */}
      <section className="join-section">
        <div className="join-content">
          <h2>{t('join.title', '讓臺北的美在創新中綻放出前所未有的光彩')}</h2>
          <p>{t('join.subtitle', '你以為我們只是來賣零食的嗎？')}</p>
          <button onClick={() => navigate('/signup')}>
            {t('join.button', '成為 Fü-Mart 會員')}
          </button>
        </div>
      </section>

      <Footer isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} showFull />
    </div>
  );
};

export default AboutUs;
