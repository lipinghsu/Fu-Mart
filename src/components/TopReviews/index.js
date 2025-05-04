import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { firestore } from "../../firebase/utils";
import { Rating } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import QutationMark from '../../assets/quotation-mark.png'
import './styles.scss';

// const getStarColor = () => '#FF8F00';
const getStarColor = () => '#';

const TopReviews = () => {
  const [topReviews, setTopReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const marqueeRef = useRef(null);
  const scrollInterval = useRef(null); // Ref to store the interval ID

  useEffect(() => {
    let startPos = 0;
    let scrollStartPos = 0;
    let isDragging = false;
    const marquee = marqueeRef.current;

    // Clone items and mark them with a class to identify them
    const cloneItems = () => {
      const marqueeContent = marquee.querySelector('.marquee-content');
      const children = Array.from(marqueeContent.children);

      // Clone only after loading is complete
      if (!isLoading && !marqueeContent.querySelector('.cloned')) {
        children.forEach((child) => {
          const clone = child.cloneNode(true);
          clone.classList.add('cloned'); // Add a class to identify clones
          marqueeContent.appendChild(clone);
        });
      }
    };

    const handleMouseDown = (event) => {
      isDragging = true;
      startPos = event.pageX;
      scrollStartPos = marquee.scrollLeft;
      event.preventDefault(); // Prevent text selection
      stopScrolling(); // Stop auto-scroll when dragging starts
    };

    const handleMouseMove = (event) => {
      if (isDragging) {
        const diff = event.pageX - startPos;
        marquee.scrollLeft = scrollStartPos - diff;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      startScrolling(); // Resume auto-scroll when dragging stops
    };

    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        isDragging = true;
        startPos = event.touches[0].pageX;
        scrollStartPos = marquee.scrollLeft;
        event.preventDefault(); // Prevent scrolling the whole page
        stopScrolling(); // Stop auto-scroll when touch starts
      }
    };

    const handleTouchMove = (event) => {
      if (isDragging && event.touches.length === 1) {
        const diff = event.touches[0].pageX - startPos;
        marquee.scrollLeft = scrollStartPos - diff;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      startScrolling(); // Resume auto-scroll when touch ends
    };

    const handleScroll = () => {
      if (marquee.scrollLeft >= marquee.scrollWidth / 2) {
        marquee.scrollLeft = 0; // Reset the scroll position to the start

        // Remove the cloned items when resetting the scroll position
        const clonedItems = marquee.querySelectorAll('.cloned');
        clonedItems.forEach((clonedItem) => clonedItem.remove());

        // Clone items again for the next loop, but only if not loading
        if (!isLoading) {
          cloneItems();
        }
      } else {
        marquee.scrollLeft += 1; // Adjust the scroll speed here
      }
    };

    const startScrolling = () => {
      // Clear the previous interval if it exists
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }

      // Start a new interval for auto-scrolling
      scrollInterval.current = setInterval(() => {
        handleScroll();
      }, 20); // Adjust the interval for smoother scrolling
    };

    const stopScrolling = () => {
      clearInterval(scrollInterval.current); // Stop scrolling on hover or touch
    };

    // Clone items when the loading is complete
    if (!isLoading) {
      cloneItems(); // Clone the items to fill the space and create a loop
      startScrolling(); // Start scrolling
    }

    // Add hover event listeners to stop scrolling when hovered
    marquee.addEventListener('mouseenter', stopScrolling);
    marquee.addEventListener('mouseleave', startScrolling);

    // Add mouse and touch event listeners
    marquee.addEventListener('mousedown', handleMouseDown);
    marquee.addEventListener('mousemove', handleMouseMove);
    marquee.addEventListener('mouseup', handleMouseUp);
    marquee.addEventListener('mouseleave', handleMouseUp);
    marquee.addEventListener('touchstart', handleTouchStart);
    marquee.addEventListener('touchmove', handleTouchMove);
    marquee.addEventListener('touchend', handleTouchEnd);

    return () => {
      clearInterval(scrollInterval.current); // Clear interval on unmount
      marquee.removeEventListener('mouseenter', stopScrolling);
      marquee.removeEventListener('mouseleave', startScrolling);
      marquee.removeEventListener('mousedown', handleMouseDown);
      marquee.removeEventListener('mousemove', handleMouseMove);
      marquee.removeEventListener('mouseup', handleMouseUp);
      marquee.removeEventListener('mouseleave', handleMouseUp);
      marquee.removeEventListener('touchstart', handleTouchStart);
      marquee.removeEventListener('touchmove', handleTouchMove);
      marquee.removeEventListener('touchend', handleTouchEnd);
    };
  }, [topReviews, isLoading]);


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
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching top reviews:", error);
        setIsLoading(false);
      } finally {
        // Ensure loading state is set to false after fetching reviews
        setIsLoading(false);
      }
    };

    fetchTopReviews();
  }, []);

  
  const renderSkeletonLoader = (count) => {
    return Array.from({ length: count }).map((_, index) => (
      <div className='item skeleton' key={`skeleton-${index}`}>
        <div className='inner-wrap'>
          <div className='top skeleton-bar'>
          <div className='top-content '></div>
          </div>

          <div className='center skeleton-bar'>
            <div className='review-content '></div>
          </div>

          <div className='bottom skeleton-bar'>
            <div className='user-prof-container'>
              <span className='user-name'></span>
              <span className='prof-name'></span>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="top-reviews">
       {/* <h1 className="heading">Discover the best professors at Cal Poly SLO!</h1> */}
       {/* <h2 className="subheading">Your top resource for professor ratings and student feedback.</h2> */}
      <h1 className="title">The Latest Reviews from Students</h1>
      <div className="marquee" ref={marqueeRef}>
        <div className="marquee-content">
        {isLoading
          ? renderSkeletonLoader(6) 
          : topReviews.map((review, index) => ( 
              <div className="item" key={index} >
                <div className="inner-wrap">
                  <div className="top">
                    <div className='pin'>
                    </div>
                  
                    <div className="rating-score">
                    
                      <Rating
                        value={review.difficultyRating}
                        name="size-large"
                        size="large"
                        icon={<StarRoundedIcon fontSize="inherit" />}
                        emptyIcon={<StarRoundedIcon fontSize="inherit" style={{ opacity: 1, color: '#dee3dd' }} />}
                        readOnly
                        style={{
                          color: getStarColor(review.difficultyRating),
                        }}
                      />
                    </div>
                  </div>
                  <div className="center">
                  <img src={QutationMark} className='q-mark-bgn' style={{ width: '8px', height: '8px' }} />
                    <div className="review-content">
                    
                      {review.reviewComment}
                      <img src={QutationMark} className='q-mark-end' style={{ width: '8px', height: '8px' }} />
                    </div>
                    
                  </div>
                  <div className="bottom">
                    
                    <div className="user-prof-container">
                      
                      <span className="prof-name">
                        <Link to={`/search/professors/${review.professorID}`}>{`${review.professorName}`}</Link>
                      </span>
                      <br />
                      <span className="user-name">Reviewed by&nbsp;{review.userName || 'Anonymous'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TopReviews;
