import React from 'react';
import './RatingContainer.scss'
import { Rating } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';

const getStarColor = (difficultyRating) => {
  // if (difficultyRating >= 5) {
  //     return '#028940';
  // } 
  // else if (difficultyRating >= 4) {
  //     return '#1B9E77';
  // } 
  // else if (difficultyRating >= 3) {
  //     return '#FF8F00';
  // } 
  // else if (difficultyRating >= 2) {
  //     return '#FFAB00';
  // } 
  // else if (difficultyRating >= 1) {
  //     return '#FFC20D';
  // } 
  // else {
  //     return 'transparent';
  // }
  // return '#FF8F00'; 
  return 'FFC20D';
};



const RatingContainer = ({ difficultyRating }) => (
  <div className="ratingContainer">
    <div className="rating-wrap">
      <div className="difficultyRatingRow ratingRow">
        <div className="starRating">
          <Rating
            precision={0.5}
            value={difficultyRating}
            max={5}
            size="large"
            readOnly
            icon={<StarRoundedIcon fontSize="inherit" />}
            emptyIcon={<StarBorderRoundedIcon style={{ opacity: 1, color: '#dee3dd' }} fontSize="inherit"  />}
            style={{
              color: getStarColor(difficultyRating),
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

export default RatingContainer;
