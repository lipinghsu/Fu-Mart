// src/pages/AboutUs.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.scss';
import signature from '../../assets/signature.png';

import cornerImg from '../../assets/corner-image.jpg';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      {/* Corner Decorations */}
      <div className="corner-decoration top-left">
        <img src={cornerImg} alt="Corner" />
      </div>
      <div className="corner-decoration top-right">
        <img src={cornerImg} alt="Corner" />
      </div>
      <div className="corner-decoration bottom-left">
        <img src={cornerImg} alt="Corner" />
      </div>
      <div className="corner-decoration bottom-right">
        <img src={cornerImg} alt="Corner" />
      </div>

      <div className="about-card">


        <h1 className="about-title">關於福罵</h1>

        <p className="about-paragraph">
          <span>便利商店在臺灣的街頭隨處可見，但我們至今仍然缺乏一個真正像樣又屬於自己的品牌。</span>
          <span>創立<strong>福罵 （Fü-Mart）</strong> 的主要原因，是因為我相信：臺灣的實力絕對不只侷限於珍珠奶茶和半導體，我們也能做出其他比任何外商還要更棒的產品。</span>
        </p>

        <p className="about-paragraph">
          只要願意持續學習、不斷改良，我們就能打破世界對臺灣的刻板印象。
          本土的產品不只需要更整潔、更有設計感，還要能夠成為<strong>提升臺灣整體標準的向量</strong>。
          便利商店是大家日常生活中最常接觸到的空間；但福罵不只是個便利商店，而是我拿來改變臺灣的起點。
        </p>

        <p className="about-paragraph">
          中華民國的美值得被世界看見；但是<strong>我們不僅要有能力登上世界舞臺，還必須要有實力在這個舞臺上競爭</strong>。
          希望有一天，臺灣的商品也能夠藉由設計與品質來吸引到世界的目光，讓全亞洲、甚至全地球都看到臺灣的進步與魅力。
        </p>

        <p className="about-tagline">
          從網路到街角，從一間便利商店開始，讓我們一起把臺灣的美展現給全世界。
        </p>

        <button className="join-button" onClick={() => navigate('/signup')}>
          加入福罵
        </button>
        {/* <p className="about-ps">
          （福罵永遠拒絕販售香菸）
        </p> */}
        {/* <div className="about-signature">
          <img src={signature} alt="Signature" />
        </div> */}
        {/* <p className="about-signature">
          — 設計與開發：立平 Hsu
        </p> */}
        {/* <a className="home-button" onClick={() => navigate('/')}>
          回首頁
        </a> */}
      </div>
    </div>
  );
};

export default AboutUs;
