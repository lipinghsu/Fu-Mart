// src/pages/AboutUs.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.scss';
// import signature from '../../assets/signature.png';

import cornerImg from '../../assets/corner-image.jpg';

const AboutUs = () => {
  const navigate = useNavigate();
  const cardRef = useRef(null);

// useEffect(() => {
//   const card = cardRef.current;
//   if (!card) return;

//   const paragraphs = Array.from(card.querySelectorAll('p'));
//   const texts = paragraphs.map(p => p.textContent);
//   // 清空所有文字
//   paragraphs.forEach(p => (p.textContent = ''));

//   let pi = 0, ci = 0;
//   const speed = 25;               // 每字基礎間隔(ms)
//   const paragraphDelay = 200;     // 段落間延時(ms)
//   const punctuationDelay = 100;
//   const punctuationChars = new Set(['、','，', '：', '；' ]);  // 你可以再加其它標點

//   function typeChar() {
//     if (pi >= paragraphs.length) return;

//     const p = paragraphs[pi];
//     const txt = texts[pi];

//     if (ci < txt.length) {
//       const char = txt[ci];
//       p.textContent += char;
//       ci++;

//       const delay = punctuationChars.has(char)
//         ? punctuationDelay : '。' === char ? 100
//         : speed;

//       setTimeout(typeChar, delay);
//     } else {
//       // 這段打完後，進下一段
//       pi++;
//       ci = 0;
//       setTimeout(typeChar, paragraphDelay);
//     }
//   }

//   typeChar();
// }, []);


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

      <div className="about-card" ref={cardRef}>


        <h1 className="about-title">關於福罵</h1>

        <p className="about-paragraph">
          福罵（Fü-Mart） 是一個創立於 2025 年的線上便利商店，
          創辦人為一位移民加州的臺裔華僑，在返臺期間厭倦了複雜的傳統購物方式以及被外商統治的街頭。
          目前販售的商品大多來自創辦人在亞洲與美洲的生活經驗；從童年記憶裡的零食、旅途中挖到的寶物，到單純有趣、值得收藏的日用品，每一樣商品都是生活故事的延伸。
          這個平臺未來的目標是成為一個能讓臺灣人可以快速交易、自由分享的媒介，讓大家把時間省下來去做真正熱愛的事情。
        </p>

        <p className="about-paragraph">
          <p className="about-paragraph">
            {/* 目前販售的商品大多來自創辦人在亞洲與美洲的生活經驗。從童年記憶裡的零食、旅途中挖到的寶物，到單純有趣、值得收藏的日用品，每一樣商品都是故事的延伸。 */}
          </p>

        </p>

        <p className="about-paragraph">
          {/* 這個平臺未來的目標是成為一個讓臺灣人能快速買賣、自由分享的媒介，讓大家把時間省下來去做真正熱愛的事情。 */}
          {/* 不只保留便利商店該有的方便性，更希望顧客能找快速的到自己喜歡又新奇的商品，也讓整個消費體驗更有趣。 */}
        </p>

        <button className="join-button" onClick={() => navigate('/signup')}>
          加入福罵
        </button>
        {/* some chat gpt bs */}
        
      </div>
    </div>
  );
};

export default AboutUs;
