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
          福罵（FÜ-MART）不是什麼存在了一甲子的名店老鋪，只是個 2025 年在臺北市永康街附近的一間青年旅館內無意間架設出來的網路便利商店。
          創辦人是一位移民到加州的臺裔華僑，在回到臺北到處逛街時厭倦了複雜的傳統購物方式以及被外商統治的街頭。
        </p>

        <p className="about-paragraph">
          <p className="about-paragraph">
            福罵目前販售的商品，大多來自創辦人在美洲與亞洲的生活經驗；有的是異國生活裡或小時候的懷舊風味，有的是旅途中意外挖到的寶物，也有些只是單純有趣、值得分享或收藏紀念的好物。
          </p>

        </p>

        <p className="about-paragraph">
          這個平臺未來的目標，是成為一個能讓臺灣人自由快速交流與探索的交易媒介。不只保留便利商店該有的方便性，更希望顧客能找快速的到自己喜歡又新奇的商品，也讓整個消費體驗更有趣。
          福罵的目的很簡單：想讓購物變得更簡單省時也更愉快。
          幫大家把想找的、想買的、想分享的東西通通聚在一起，讓大家把時間省下來去做自己真正喜愛的事情。
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
