import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { signOutUserStart } from '../../redux/User/user.actions';
import { selectCartItemsCount } from '../../redux/Cart/cart.selectors';
import SignupDropdown from './SignupDropdown';
import ConditionalLink from './ConditionalLink';
import NavItem from './NavItem';
import FormInput from '../forms/FormInput';
import Button from '../forms/Button';
import { TbMenu2, TbX } from "react-icons/tb";
import Logo from '../../assets/polyfica_logo2.png';
import SideMenuDefaultUserImage from '../../assets/account_circle.png';
import { firestore } from '../../firebase/utils';
import './styles.scss';
import RatingSlider from './RatingSlider';
import { useTranslation } from "react-i18next";
import closeImage from '../../assets/closeImage.png';
import moreIcon from '../../assets/more-horiz-icon.svg'
import ReviewModal from './ReviewModal'; // Imported reusable modal component

const mapState = (state) => ({
  currentUser: state.user.currentUser,
  totalNumCartItems: selectCartItemsCount(state),
});

const Header = ({ showSignupDropdown, setShowSignupDropdown, homepageHeader, aboutpageHeader, mainHeader }) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(mapState);
  const profileImageUrl = currentUser ? currentUser.userProfileImage : null;
  const profileImageClass = "icon-button" + " " + (profileImageUrl ? "with-profile-picture" : "");
  const myAccountLink = (currentUser && currentUser.userRoles && currentUser.userRoles[0]) === "admin" ? "/admin" : "/dashboard";
  
  const [mobile, setMobile] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [hide, setHide] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRevPressed, setIsRevPressed] = useState(false);

  // --- Form states for the review modal ---
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [department, setDepartment] = useState('');
  const [reviewCourseName, setReviewCourseName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [difficultyRating, setDifficultyRating] = useState(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  

  const refOutsideDiv = useRef(null);
  const dropdownRef = useRef(null);

  // Validate form completion for the review modal
  useEffect(() => {
    const isComplete =
      firstName.trim() &&
      lastName.trim() &&
      schoolName.trim() &&
      department.trim() &&
      reviewCourseName.trim() &&
      reviewComment.trim() &&
      difficultyRating !== null;
    setIsFormComplete(isComplete);
  }, [firstName, lastName, schoolName, department, reviewCourseName, reviewComment, difficultyRating]);

  const signOut = () => {
    dispatch(signOutUserStart());
  };

  // Disable window scrolling if sidebar or modal is active
  useEffect(() => {
    if (sidebar || showModal) {
      document.body.style.overflow = 'hidden';
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebar, showModal]);

  // Detect if mouse release anywhere on the page
  useEffect(() => {
    const handleMouseUp = () => setIsPressed(false);
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Detect scroll to add scrolled class
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide sidebar if user clicks outside the div
  useEffect(() => {
    const handleClickOutsideDiv = (e) => {
      if (!e.target.closest('.sidebar')) {
        setSidebar(false);
      }
    };
    if (sidebar) {
      document.addEventListener("click", handleClickOutsideDiv, true);
    }
    return () => {
      document.removeEventListener('click', handleClickOutsideDiv);
    };
  }, [sidebar]);

  // Hide dropdown menu if user clicks outside of the div
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSignupDropdown(false);
      }
    };

    if (showSignupDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSignupDropdown]);

  // Detect window size -> mobile mode
  useEffect(() => {
    if (window.innerWidth <= 840) {
      setMobile(true);
    }
  }, []);

  // Detect window resize -> mobile/desktop mode
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 840) {
        setMobile(true);
      } else {
        setMobile(false);
        setSidebar(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dismiss modal on Esc key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) { // 27 is Esc
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Control navbar visibility (e.g., hide header when scrolled to bottom)
  const controlNavbar = () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (homepageHeader) {
      if (scrollY >= maxScroll - 1) {
        setHide(true);
      } else {
        setHide(false);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => window.removeEventListener('scroll', controlNavbar);
    }
  }, [lastScrollY]);

  const { t } = useTranslation(["header", "common"]);

  // Toggle review modal open/close with scroll to top
  const handleWriteReviewClick = () => {
    if (!showModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        setShowModal(true);
        document.body.style.overflow = 'hidden';
      }, 380); // Adjust delay as needed
    } else {
      setShowModal(false);
      document.body.style.overflow = '';
    }
  };

  // Function to clear form fields after modal close or submission
  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setSchoolName('');
    setDepartment('');
    setReviewCourseName('');
    setReviewComment('');
    setDifficultyRating(null);
  };

  // Handle form submit for review modal
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!isFormComplete) return;
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
        department: department.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        schoolName: schoolName.trim(),
        commentData: [commentData],
        likeCount: 0,
        follower: [],
        profileImage: ""
      };
      // Add new professor data to Firestore and update document with ID
      const docRef = await firestore.collection('professors').add(newProfessorData);
      await docRef.update({ profID: docRef.id });
      setShowModal(false);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error submitting form:', error);
    }
  };

  return (
    <>
      <header
        className={`
          header 
          ${hide ? "hidden" : ""} 
          ${sidebar ? "sidebar-active" : ""} 
          ${homepageHeader ? "homepage" : ""} 
          ${aboutpageHeader ? "aboutheader" : ""}
          ${isScrolled ? "scrolled" : ""}
          ${mainHeader ? "main" : ""}
        `}
      >
        <div className="wrap">
          {mobile && (
            <div className="sideMenu">
              <a>
                {!sidebar ? (
                  <TbMenu2 size={28} onClick={() => setSidebar(!sidebar)} color={"black"} strokeWidth={"2"} />
                ) : (
                  <TbX size={28} onClick={() => setSidebar(!sidebar)} color={"black"} strokeWidth={"2"} />
                )}
              </a>
            </div>
          )}

          <div className="logo">
            <Link to="/">
              <img src={Logo} alt="LOGO" />
            </Link>
          </div>

          {!mobile && (
            <div className="callToActions">
              <ul>
                {currentUser && [
                  <ConditionalLink
                    key="reviewBtn"
                    text={t("Write a Review")}
                    link="/login"
                    className={`review-btn ${isScrolled ? 'scrolled' : ''}`}
                    preventLink={true}
                    handleWriteReviewClick={handleWriteReviewClick}
                    onMouseDown={() => setIsRevPressed(true)}
                    onMouseUp={() => setIsRevPressed(false)}
                    onMouseLeave={() => setIsRevPressed(false)}
                    setIsRevPressed={setIsRevPressed}
                  />
                ]}

                {currentUser && [
                  <div className="signup-container" ref={dropdownRef} key="signup1">
                    <button
                      className="signup-btn"
                      onClick={() => setShowSignupDropdown(!showSignupDropdown)}
                      onMouseDown={() => {}}
                      onMouseUp={() => {}}
                    >
                      <img src={moreIcon}/>
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                    {showSignupDropdown && <SignupDropdown label="Log Out" link="/" signOut={signOut} />}
                  </div>
                ]}

                {!currentUser && (
                  <>
                    <ConditionalLink
                      key="reviewBtnGuest"
                      text={t("Write a Review")}
                      className={`review-btn ${isScrolled ? 'scrolled' : ''} ${homepageHeader ? 'homepage' : ''}`}
                      navClassName={`nav-item ${isScrolled ? 'scrolled' : ''} ${homepageHeader ? 'homepage' : ''}`}
                      preventLink={true}
                      reviewButton={true}
                      handleWriteReviewClick={handleWriteReviewClick}
                      onMouseDown={() => setIsRevPressed(true)}
                      onMouseUp={() => setIsRevPressed(false)}
                      onMouseLeave={() => setIsRevPressed(false)}
                      setIsRevPressed={setIsRevPressed}
                      
                    />

                    <NavItem
                      key="loginBtn"
                      text={t("Log In")}
                      link="/login"
                      className="login-button"
                      mobile={false}
                      onMouseDown={() => {}}
                      onMouseUp={() => {}}
                    />

                    <div
                      className="signup-container"
                      onMouseDown={() => {}}
                      onMouseUp={() => {}}
                      ref={dropdownRef}
                      key="signup2"
                    >
                      <button
                        className={`signup-btn ${isScrolled ? 'scrolled' : ''} ${homepageHeader ? 'homepage' : ''}`}
                        onClick={() => setShowSignupDropdown(!showSignupDropdown)}
                      >
                        {/* <span className="material-symbols-outlined">more_horiz</span> */}
                        <img src={moreIcon}/>
                      </button>
                      <SignupDropdown class="SignupDropdown" showSignupDropdown={showSignupDropdown} />
                    </div>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className={sidebar ? "sidebar active" : "sidebar"} ref={refOutsideDiv}>
          <ul className="sidebar-items">
            {currentUser && [
              <div className="row-account" key="account">
                <NavItem
                  image={profileImageUrl ? profileImageUrl : SideMenuDefaultUserImage}
                  profileImageClass={profileImageClass}
                  mobile={true}
                  setSidebar={setSidebar}
                  sidebar={sidebar}
                  link={myAccountLink}
                >
                  <span className="row-account-text">{t("Account")}</span>
                </NavItem>
              </div>,
              <NavItem
                key="logout"
                setSidebar={setSidebar}
                sidebar={sidebar}
                signOut={signOut}
                logOutButton={true}
                text={t("Log out")}
              />,
            ]}

            {!currentUser && (
              <div className="logged-out">
                <div className="account">
                  <NavItem text={t("About")} link="/about" setSidebar={setSidebar} sidebar={sidebar} mobile={true} />
                  <NavItem text={t("Log In")} link="/login" setSidebar={setSidebar} sidebar={sidebar} mobile={true} />
                  <NavItem text={t("Sign Up")} link="/registration" setSidebar={setSidebar} sidebar={sidebar} mobile={true} />
                </div>
                <div className="row-review" onClick={handleWriteReviewClick}>
                  <ConditionalLink
                    text={t("Write a Review")}
                    link="/login"
                    className={`review-btn ${isScrolled ? 'scrolled' : ''}`}
                    preventLink={true}
                    handleWriteReviewClick={handleWriteReviewClick}
                    onMouseDown={() => setIsRevPressed(true)}
                    onMouseUp={() => setIsRevPressed(false)}
                    onMouseLeave={() => setIsRevPressed(false)}
                    setIsRevPressed={setIsRevPressed}
                  />
                </div>
              </div>
            )}
          </ul>
        </div>
      </header>

      {/* Render the ReviewModal component */}
      <ReviewModal 
        showModal={showModal}
        setShowModal={setShowModal}
        isLoading={isLoading}
        isFormComplete={isFormComplete}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        schoolName={schoolName}
        setSchoolName={setSchoolName}
        department={department}
        setDepartment={setDepartment}
        reviewCourseName={reviewCourseName}
        setReviewCourseName={setReviewCourseName}
        reviewComment={reviewComment}
        setReviewComment={setReviewComment}
        difficultyRating={difficultyRating}
        setDifficultyRating={setDifficultyRating}
        handleCourseNameChange={(e) => {
          setReviewCourseName(e.target.value);
        }}
        handleFormSubmit={handleFormSubmit}
        clearForm={clearForm}
      />
    </>
  );
};

Header.defaultProps = {
  currentUser: null,
};

export default Header;
