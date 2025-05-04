import React from 'react';
import './TempAd.scss';

const TempAd = ({ adData }) => {
    // Use the provided adData fields if available; otherwise, fallback to the default bkstr ad
    const {
      imageUrl = "https://bkstr.scene7.com/is/image/Bkstr/NTNL-2025-Spring-Sale-Event-Primary-Thin-1720x100?scl=1",
      title = "Spring Sale Event",
    //   description = "20% off select clothing & gifts. Shop Now",
      link = "https://www.bkstr.com/calpolystore/store-hours"
    } = adData || {};
  
    return (
      <div className="temp-ad">
        <a href={link} target="_blank" rel="noopener noreferrer">
          <img src={imageUrl} alt={title} className="ad-image" />
        </a>
        {/* <div className="ad-content"> */}
          {/* <h4 className="ad-title">{title}</h4> */}
          {/* <p className="ad-description">{description}</p> */}
        {/* </div> */}
      </div>
    );
  };

export default TempAd;
