import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { firestore } from '../../../firebase/utils';
import { arrayUnion, arrayRemove } from "firebase/firestore";
import defaultProfileImage from "../../../assets/defaultProfImage.png";
import depIcon from "../../../assets/dep-icon.png";
import schoolIcon from "../../../assets/school-icon.png";
import RatingSlider from "../../Header/RatingSlider";
import MobilePopup from "../../MobilePopup";
import ReviewModal from "../../Header/ReviewModal";

const ProfessorDetails = ({ professor, currentUser }) => {
  const history = useHistory();
  const [hideMobilePopUp, setHideMobilePopUp] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 840);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [difficultyRating, setDifficultyRating] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewCourseName, setReviewCourseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  useEffect(() => {
    if(!hideMobilePopUp){
      document.body.style.overflow = "hidden";
    }
    else{
      document.body.style.overflow = "scroll";
    }
  }, [hideMobilePopUp]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 840);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Check if the user has liked or is following the professor
  useEffect(() => {
    if (currentUser && professor) {
      setHasLiked(professor.userLikes?.includes(currentUser.uid));
      setIsFollowing(professor.followers?.includes(currentUser.uid));
    }
  }, [currentUser, professor]);

  const handleUpload = async ({ reviewComment, reviewCourseName, difficultyRating }) => {
  
    if (difficultyRating === null) {
      alert('Please provide a Difficulty Rating.');
      return;
    }
  
    if (!reviewComment || reviewComment.trim() === '') {
      alert('Please provide a Review Comment.');
      return;
    }
  
    if (!reviewCourseName || reviewCourseName.trim() === '') {
      alert('Please provide the Course Code.');
      return;
    }
  
    setLoading(true);
    try {
      const newCommentData = {
        difficultyRating,
        reviewComment,
        reviewCourseName,
        reviewDates: new Date(),
        likes: 0,
        userLikes: [],
        userDislikes: [],
      };
  
      const professorRef = firestore.collection('professors').doc(professor.profID);
      await professorRef.update({
        commentData: arrayUnion(newCommentData),
      });
  
      window.location.reload();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };
  

  // Handle Like button click
  const handleLike = async () => {
    if (!currentUser) {
      // alert("Please log in to like.");
      history.push('/login');
      return;
    }

    const professorRef = firestore.collection('professors').doc(professor.profID);
    try {
      if (hasLiked) {
        // Remove like
        await professorRef.update({
          userLikes: arrayRemove(currentUser.uid)
        });
        setHasLiked(false);
      } else {
        // Add like
        await professorRef.update({
          userLikes: arrayUnion(currentUser.uid)
        });
        setHasLiked(true);
      }
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  // Handle Follow button click
  const handleFollow = async () => {
    if (!currentUser) {
      // alert("Please log in to follow.");
      history.push('/login');
      return;
    }

    const professorRef = firestore.collection('professors').doc(professor.profID);
    try {
      if (isFollowing) {
        // Unfollow
        await professorRef.update({
          followers: arrayRemove(currentUser.uid)
        });
        setIsFollowing(false);
      } else {
        // Follow
        await professorRef.update({
          followers: arrayUnion(currentUser.uid)
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const toggleFormExpansion = () => {
    if(!isFormExpanded){
      setIsFormExpanded(!isFormExpanded);
    }
  };

  const collapseForm = () => {
    setIsFormExpanded(false);
  };

  const toggleMobilePopUp = () => {
    setHideMobilePopUp(!hideMobilePopUp);
  };

  return (
    <div className="profDetails">
      <div className="profHeader">
        <div className="top-wrap">

          <div className='prof-left-wrap'>
          <h2 className="profName">{professor.firstName} {professor.lastName}</h2>
        <p className="profIntro">

          <div className='section-wrap'>
            <div className='icon-wrap'>
                <img src={depIcon}/>
            </div>
            <div className='prof-intro-dep'>
              {professor.department} Professor
            </div>
          </div>
          <div className='section-wrap'>
            
              <div className='icon-wrap'>
                <img src={schoolIcon}/>
              </div>
              <div className='prof-intro-dep'>       
                {professor.schoolName}
              </div>
          </div>
          
        </p>
          </div>
          <div className='prof-right-wrap'>
          <div className="profileImage-wrap">
            {professor.profileImage ? (
              <img src={professor.profileImage} alt={`${professor.firstName} ${professor.lastName}`} />
            ) : (
              <img src={defaultProfileImage} alt="Default Profile" className='default-profile-image' />
            )}
          </div>
          </div>



        </div>

        <div className="bottom-wrap">
          <div className="count-wrap">
            <div className="review-count">
              <span className="number">{professor.commentData?.length || 0}</span>{" "}
              <span className="count-text">{professor.commentData?.length > 1 ? "Reviews" : "Review"}</span>
            </div>
            <div className="follower-count">
              <span className="number">{professor.followers?.length || 0}</span>{" "}
              <span className="count-text">{professor.followers?.length > 1 ? "Followers" : "Follower"}</span>
            </div>
            <div className="like-count">
              <span className="number">{professor.userLikes?.length || 0}</span>{" "}
              <span className="count-text">Like{professor.userLikes?.length > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="button-wrap">
            {!isLargeScreen ? 
              <button className={`review-button-mobile ${!hideMobilePopUp ? " active" : ""}`} onClick={toggleMobilePopUp}>Review</button>
            : null}
            <button className={`follow-button ${isFollowing ? "following" : ""}`} onClick={handleFollow}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
            {/* <button className={`like-button ${hasLiked ? "liked" : ""}`} onClick={handleLike}>
              {hasLiked ? "Unlike" : "Like"}
            </button> */}
          </div>
        </div>

        <>
          {isLargeScreen && (
            <div
              className={isFormExpanded ? "review-form expanded" : "review-form"}
              onClick={toggleFormExpansion}
            >
              <div className="text-form-collapsed">Write a Review</div>
            </div>
          )}

          {/* render your modal as a sibling */}
          <ReviewModal 
            showModal={isFormExpanded}
            setShowModal={setIsFormExpanded}
            // isLoading={isLoading}
            // isFormComplete={isFormComplete}
            pFirstName={professor.firstName}
            // setFirstName={setFirstName}
            pLastName={professor.lastName}
            // setLastName={setLastName}
            schoolName={professor.schoolName}
            // setSchoolName={setSchoolName}
            department={professor.department}
            inProfProfile={true}
            // setDepartment={setDepartment}
            // reviewCourseName={reviewCourseName}
            // setReviewCourseName={setReviewCourseName}
            // reviewComment={reviewComment}
            // setReviewComment={setReviewComment}
            // difficultyRating={difficultyRating}
            // setDifficultyRating={setDifficultyRating}
            // handleCourseNameChange={(e) => {
            //   setReviewCourseName(e.target.value);
            // }}
            // handleFormSubmit={handleFormSubmit}
            // clearForm={clearForm}
          />
        </>
      </div>

      {/* Pop-up modal for mobile review form */}
      <MobilePopup
        professor={professor}
        onSubmit={handleUpload}  // Pass handleUpload without any event
        loading={loading}
        onClose={() => setHideMobilePopUp(true)}
        isVisible={!hideMobilePopUp}
      />
    </div>
  );
};

export default ProfessorDetails;
