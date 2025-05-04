import React, { useState } from 'react';
import RatingSlider from '../../Header/RatingSlider';

const CommentForm = ({
    isFormExpanded,
    newComment,
    handleCommentChange,
    handleDifficultyRating,
    courseCode,
    handleCourseCodeChange,
    handleProfessorUpload,
    handleFormClick,
    handleFormCollapse
}) => {
    return (
        <div className="commentForm" onClick={handleFormClick}>
            <form
                onSubmit={handleProfessorUpload}
                className={isFormExpanded ? 'expandedForm' : 'collapsedForm'}
            >
                <textarea
                    className={isFormExpanded ? 'expandedTextArea' : 'collapsedTextArea'}
                    placeholder="Add a comment"
                    value={newComment}
                    onChange={handleCommentChange}
                    required
                ></textarea>
                {isFormExpanded && (
                    <>
                        <div className='column-wrap'>
                            <div className="form-row rating-sliders">
                                <div className="slider-label">Rating</div>
                                <RatingSlider
                                    onChange={(value) => handleDifficultyRating(value)}  // Correctly handle the value
                                    required
                                />
                            </div>
                        </div>
                        <div className="courseCodeContainer">
                            <label>Course Code:</label>
                            <input
                                className="courseCodeInput"
                                type="text"
                                value={courseCode}
                                onChange={handleCourseCodeChange}
                                placeholder="Enter course code"
                                required
                            />
                            <div className="buttonGroup">
                                <button type="submit" className="submitButton">Submit</button>
                                <button type="button" className="cancelButton" onClick={handleFormCollapse}>Cancel</button>
                            </div>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default CommentForm;
