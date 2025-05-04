import React, { useRef, useState, useEffect } from 'react';
import RatingContainer from '../RatingContainer';
import shareIcon from '../../../assets/share_icon.png';
import commentIcon from '../../../assets/comment-icon.png';
import heartIcon from '../../../assets/like-icon.png';
import heartIcon_svg from '../../../assets/heart-icon.svg';
import moreIcon_svg from '../../../assets/more-horiz-icon.svg';
import sirenIcon from '../../../assets/siren-icon.png';
import defaultProfileImage from "../../../assets/defaultProfImage.png";
import './CommentItem.scss'





const CommentItem = ({ comment, currentUser, handleLike, handleDislike, index, handleSubComment}) => {
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 840);
    const moreRef = useRef();
    const [showMore, setShowMore] = useState(false);
    // Update state based on window size
    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 840);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    

    const handleShare = async (event) => {
        const shareData = {
            title: 'Check out this professor review',
            text: comment.reviewComment,
            url: window.location.href,
        };
        if (navigator.canShare) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            alert('Share feature is not supported in your browser.');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreRef.current && !moreRef.current.contains(event.target)) {
                setShowMore(false);
            }
        };
    
        if (showMore) {
            document.addEventListener('mousedown', handleClickOutside);
        }
    
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMore]);

    return (
        <div className="commentItem">
            <div className="commentHeader">
                
                {/* make review button like reddit comment button */}
                <div className="commentContainer">
                    
                    <div className="commentTop">
                        <div className="profileImage-wrap">
                            {comment.profileImage ? (
                            <img src={comment.profileImage} alt={`${comment.firstName} ${comment.lastName}`} />
                            ) : (
                            <img src={defaultProfileImage} alt="Default Profile" className='default-profile-image' />
                            )}
                        </div>

                        <div className='user-date-wrap'>
                            <div className="commentUser">
                                @{comment.userName || 'Anonymous'}
          
                            </div>
                            {/* &nbsp; */}
                            <p className="commentDate"
                            title={comment.reviewDates ? (() => {
                                    const date = new Date(comment.reviewDates.seconds * 1000);
                                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    })()
                                : ''}
                            >
                            {comment.reviewDates
                                ? (() => {
                                    const date = new Date(comment.reviewDates.seconds * 1000);
                                    const now = new Date();
                                    const diffMs = now - date; // difference in milliseconds
                                    const diffSeconds = Math.floor(diffMs / 1000);
                                    if (diffSeconds < 60) {
                                    return `${diffSeconds}s`;
                                    }
                                    const diffMinutes = Math.floor(diffSeconds / 60);
                                    if (diffMinutes < 60) {
                                    return `${diffMinutes}m`;
                                    }
                                    const diffHours = Math.floor(diffMinutes / 60);
                                    if (diffHours < 24) {
                                    return `${diffHours}h`;
                                    }
                                    const diffDays = Math.floor(diffHours / 24);
                                    if (diffDays < 7) {
                                    return `${diffDays}d`;
                                    }
                                    
                                    const options = { month: 'long', day: '2-digit', year: 'numeric' };
                                    
                                    return date.toLocaleDateString('en-US', options);
                                })()
                                : "No date available"}
                                                                <div className="commentCourse">
                                                                {comment.reviewCourseName}
                                                            </div>
                            </p>
                        </div>

                        <RatingContainer
                            difficultyRating={comment.difficultyRating}
                        />


                    </div>

                    <p className="commentReview">{comment.reviewComment}</p>
                    <div className="likeDislikeShareContainer">
                        <div className="shareContainer">
                            <button className="likeButton" onClick={() => handleLike(index)}>
                                {isSmallScreen ? (
                                    <img src={heartIcon_svg} alt="Comment Icon" />
                                ) : (
                                <>
                                    <img src={heartIcon_svg} alt="Comment Icon" />
                                    <span className="button-text">
                                        {comment.likes || "Like"}
                                    </span>
                                </>

                                )}
                            </button>
                        </div>

                        <div className="shareContainer">
                            <button className="commentButton" onClick={handleSubComment}>
                                {isSmallScreen ? (
                                    <img src={commentIcon} alt="Comment Icon" />
                                ) : (
                                <>
                                    <img src={commentIcon} alt="Comment Icon" />
                                    <span className="button-text">
                                            Reply
                                    </span>
                                </>

                                )}
                            </button>
                        </div>

                        <div className="shareContainer">
                            <button className="shareButton" onClick={handleShare}>
                                {isSmallScreen ? (
                                    <img src={shareIcon} alt="Share Icon" />
                                ) : (
                                <>
                                    <img src={shareIcon} alt="Share Icon" />
                                    <span className="button-text">
                                            Share
                                    </span>
                                </>
                                )}
                            </button>
                        </div>
                        <div className={showMore ? "more-btn-content-wrap active" : "more-btn-content-wrap"}
                            ref={moreRef}
                        >
                        {/* <div className={"more-btn-content-wrap"}> */}
                            <div className='more-btn-content'>
                                <img src={sirenIcon} alt="Comment Icon" />
                                <div className='more-btn-text'>
                                    Report
                                </div>
                            </div>
                        </div>

                        <div className="shareContainer">
                            <button className="moreButton" onClick={() => {setShowMore(!showMore)}}>
                                <img src={moreIcon_svg} alt="Comment Icon" />
                            </button>
                        </div>


                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
