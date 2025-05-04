
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { firestore } from "../../firebase/utils";
import { Rating } from '@mui/material';
import './styles.scss';

const SiteStats = (props) => {
  const [topReviews, setTopReviews] = useState([]); // Ensure this is an array
  const [maxLengths, setMaxLengths] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 840);
  const [isLoading, setIsLoading] = useState(true); // State for loading
  const innerWrapRefs = useRef([]);

  useEffect(() => {
    const fetchTopReviews = async () => {
      try {
        const professorsRef = firestore.collection('professors');
        const snapshot = await professorsRef.get();
        let allReviews = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.commentData && data.commentData.length > 0) {
            data.commentData.forEach(review => {
              allReviews.push({
                ...review,
                professorName: `${data.firstName} ${data.lastName}`,
                professorID: data.profID
              });
            });
          }
        });

        allReviews.sort((a, b) => b.reviewDates.seconds - a.reviewDates.seconds);
        const topSixReviews = allReviews.slice(0, 6);
        setTopReviews(topSixReviews);
        setIsLoading(false); // Stop loading after fetching data
      } catch (error) {
        console.error("Error fetching top reviews:", error);
        setIsLoading(false); // Stop loading in case of error
      }
    };

    fetchTopReviews();
  }, []);

  useEffect(() => {
    const calculateMaxLengths = () => {
      const lengths = innerWrapRefs.current.map(ref => {
        const innerWrapWidth = ref ? ref.offsetWidth : 0;
        const charWidth = 7; // Average character width in pixels (adjust as necessary)
        const padding = 30; // Adjust for padding/margin
        return Math.floor((innerWrapWidth - padding) / (charWidth/6.5));
      });
      setMaxLengths(lengths);
    };

    calculateMaxLengths();
    window.addEventListener('resize', calculateMaxLengths);

    return () => {
      window.removeEventListener('resize', calculateMaxLengths);
    };
  }, [topReviews]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 840);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const renderSkeletonLoader = (count) => {
    return Array.from({ length: count }).map((_, index) => (
      <div className='item skeleton' key={`skeleton-${index}`}>
        <div className='inner-wrap'>
          <div className='top skeleton-bar'></div>
          <div className='center'>
            <div className='review-content skeleton-bar'></div>
          </div>
          <div className='bottom'>
            <div className='user-prof-container'>
              <span className='user-name skeleton-bar'></span>
              <span className='prof-name skeleton-bar'></span>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className='site-stats-wrap'>
      <div>
        text
      </div>
      <div className='site-stats-'>
        
      </div>
      
    </div>

  );
};
export default SiteStats;


