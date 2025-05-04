import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { firestore } from '../../../firebase/utils';
import FormInput from '../../forms/FormInput';
import Button from '../../forms/Button';
import closeImage from '../../../assets/closeImage.png';
import './ReviewModal.scss';
import RatingSlider from './../RatingSlider';
import { useTranslation } from "react-i18next";

const ReviewModal = ({ showModal, setShowModal, inProfProfile, pLastName }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation(["header", "common"]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [difficultyRating, setDifficultyRating] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewCourseName, setReviewCourseName] = useState('');
  const [department, setDepartment] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [isFormComplete, setIsFormComplete] = useState(false);
  // generate a one‑letter last name if you like:
  const lastInitial = pLastName?.charAt(0) || '';

  // three variations you can choose from:
  const profHeadlines = [
    {
      title: `Evaluate Prof. ${lastInitial}`,
      subtitle: `Your feedback helps others find the best professors.`
    },
    {
      title: `Review Prof. ${lastInitial}.`,
      subtitle: `Share your thoughts on their teaching style.`
    },
    {
      title: `Tell us about Prof. ${lastInitial}.`,
      subtitle: `What stood out in your lecture or lab?`
    }
  ];

  // pick one—or randomize, or pick by index:
  const { title, subtitle } = profHeadlines[0];

  // Validate the course code format.
  const handleCourseNameChange = (e) => {
    const value = e.target.value;
    const courseNameRegex = /^[A-Za-z]+\s\d+$/;
    setIsValid(courseNameRegex.test(value));
    setReviewCourseName(value);
  };

  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setSchoolName('');
    setDepartment('');
    setReviewCourseName('');
    setReviewComment('');
    setDifficultyRating(null);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (difficultyRating === null) return;
    try {
      setIsLoading(true);
      const commentData = {
        difficultyRating,
        reviewComment,
        reviewCourseName,
        reviewDates: new Date(),
        likes: 0,
        userLikes: [],
        userDislikes: []
      };
      const newProfessorData = {
        department,
        firstName,
        lastName,
        schoolName,
        commentData: [commentData]
      };

      const docRef = await firestore.collection('professors').add(newProfessorData);
      await docRef.update({ profID: docRef.id });
      setShowModal(false);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error submitting form:', error);
    }
  };

  useEffect(() => {
    const complete = firstName.trim() && lastName.trim() && schoolName.trim() && 
      department.trim() && reviewCourseName.trim() && reviewComment.trim() && difficultyRating !== null;
    setIsFormComplete(complete);
  }, [firstName, lastName, schoolName, department, reviewCourseName, reviewComment, difficultyRating]);

  return (
      <form onSubmit={handleFormSubmit}>
        <div   className={`rev-modal ${showModal ? "active" : ""} ${
    inProfProfile ? "inProfProfile" : ""
  }`}>
          <div className="modal-content">
            <span
              className="close-button"
              onClick={() => {
                setShowModal(false);
                clearForm();
              }}
            >
              <div className="close-image">
                <img src={closeImage} alt="Close" />
              </div>
            </span>
            <h2>{ inProfProfile ? title : t("Write a Review") }</h2>
            <h3>{ inProfProfile ? subtitle : t("Help us understand your class experience") }</h3>
            
            {/* Personal info only when not inProfProfile */}
            {!inProfProfile && (
            <>
              <div className="form-row name">
                <FormInput
                  type="text"
                  name="firstName"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  label={t('First Name')}
                  required
                />
                <FormInput
                  type="text"
                  name="lastName"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  label={t('Last Name')}
                  required
                />
              </div>

              <FormInput
                type="text"
                name="schoolName"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                label={t('Name of School')}
                required
              />

              <FormInput
                type="text"
                name="department"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                label={t('Department')}
                required
              />
            </>
            )}
            
            <FormInput
              type="text"
              name="reviewCourseName"
              value={reviewCourseName}
              onChange={handleCourseNameChange}
              label="Course Code"
              required
            />

            <FormInput
              type="text"
              name="reviewComment"
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              label={t("Review Comment")}
              className="reviewComment"
              required
            />
            
            <div className="column-wrap rev-modal-rating">
              <div className="form-row rating-sliders">
                <RatingSlider
                  value={difficultyRating}
                  onChange={(value) => setDifficultyRating(value)}
                  required
                  className="rev-modal-rating"
                />
              </div>
            </div>
                        
            <div className="terms">
              {t("By submitting this review, you agree to our")} 
              <span> </span>
              <Link to="/terms">{t("Terms of Service")}</Link>
              <span>{t(" and ")}</span>
              <Link to="/privacy">{t("Privacy Policy")}</Link>
              <span>{t(".")}</span>
            </div>
            
            <Button
              type="submit"
              className={`${isLoading ? "btn btn-submit isLoading" : "btn btn-submit"} ${!isFormComplete ? "inactive" : ""}`}
              disabled={isLoading || !isFormComplete}
              isLoading={isLoading}
            >
              {t("Submit Review")}
            </Button>
          </div>
        </div>
      </form>
  );
};

export default ReviewModal;
