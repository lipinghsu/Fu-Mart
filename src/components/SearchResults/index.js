import React, { useEffect, useState, useRef } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { firestore } from "../../firebase/utils";
import { Rating } from '@mui/material'; 
import defaultProfileImage from "../../assets/defaultProfImage.png";
import Dropdown from "./DropDown";
import "./SearchResults.scss";
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import LeftSideBar from '../LeftSideBar';
import RightSideBar from '../RightSideBar';

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const getStarColor = (difficultyRating) => {
  // return '#FF8F00';
};

const reviewOptions = [
  { id: 0, value: 'Review' },
  { id: 1, value: '25+' },
  { id: 2, value: '50+' },
  { id: 3, value: '100+' },
  { id: 4, value: '200+' }
];

const ratingOptions = [
  { id: 0, value: 'Rating' },
  { id: 1, value: '2.0+' },
  { id: 2, value: '3.0+' },
  { id: 3, value: '4.0+' },
  { id: 4, value: '4.5+' }
];

const sortOptions = [
  { id: 0, value: "Sort" },
  { id: 1, value: "Last Name" },
  { id: 2, value: "First Name" },
  { id: 3, value: "Most Reviews"},
  { id: 4, value: "Highest Rating"},
];

const SearchResults = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [averageDifficultyRating, setAverageDifficultyRating] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedReviewFilter, setSelectedReviewFilter] = useState({id: 0, value: 'Review'});
  const location = useLocation();
  const history = useHistory();
  const filterRef = useRef(null);
  const [dropDownClicked, setDropDownClicked] = useState(false);
  const searchTerm = new URLSearchParams(location.search).get("term");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState({id: 0, value: "Rating"});
  const [selectedSortOption, setSelectedSortOption] = useState({id: 0, value: "Sort"});
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSortDropdownVisible, setIsSortDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayedProfessors, setDisplayedProfessors] = useState(8);
  const [isMediumScreen, setIsMediumScreen] = useState(window.innerWidth > 840);
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 1100);
  const boxRightRef = useRef();
  const movingDivRef = useRef();
  const [stop, setStop] = useState(false);
  const dropdownRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null); 

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth > 1100);
      setIsMediumScreen(window.innerWidth > 840);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDropdownClick = (dropdownId) => {
    setDropDownClicked(true);
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
  };
  
  const handleSortChange = (option) => {
    setSelectedSortOption(option);
    setIsSortDropdownVisible(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  },[])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1020) {
        setIsFilterVisible(false);
      } else {
        setIsFilterVisible(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight && !loadingMore) {
        if (displayedProfessors < searchResults.length) {
          setLoadingMore(true);
          setTimeout(() => {
            setDisplayedProfessors((prevCount) => Math.min(prevCount + 8, searchResults.length));
            setLoadingMore(false);
          }, 500);
        }
      }
    };
  
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, displayedProfessors, searchResults.length]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const professorsRef = firestore.collection("professors");
        const professorsSnapshot = await professorsRef.get();
        const departmentSet = new Set();
        
        professorsSnapshot.forEach((doc) => {
          const department = doc.data().department;
          if (department) {
            departmentSet.add(department);
          }
        });

        const departmentList = Array.from(departmentSet).sort();
        setDepartments(departmentList);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchProfessors = async () => {
      setLoading(true);
      try {
        if (!searchTerm) {
          setLoading(false);
          return;
        }

        const professorsRef = firestore.collection("professors");
        let results = [];
        const searchTerms = searchTerm.split(" ").map(term => term.toLowerCase());

        const allProfessorsSnapshot = await professorsRef.get();
        let allProfessors = [];
        allProfessorsSnapshot.forEach((doc) => allProfessors.push({ id: doc.id, ...doc.data() }));

        results = allProfessors.filter(professor =>
          searchTerms.every(term =>
            professor.firstName.toLowerCase().includes(term) ||
            professor.lastName.toLowerCase().includes(term)
          )
        );

        // Apply department filter if any selected
        if (selectedDepartments.length > 0) {
          results = results.filter(professor =>
            selectedDepartments.includes(professor.department)
          );
        }

        // Apply rating filter if selected
        if (selectedRatingFilter && selectedRatingFilter.value !== 'Rating') {
          const minRating = parseFloat(selectedRatingFilter.value.replace('+', ''));
          
          results = results.filter(professor => {
            if (professor.commentData && professor.commentData.length > 0) {
              const ratings = professor.commentData
                .map(comment => parseFloat(comment.difficultyRating))
                .filter(rating => !isNaN(rating));
              if (ratings.length > 0) {
                const averageRating = ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
                return averageRating >= minRating;
              }
            }
            return false;
          });
        }

        if (selectedReviewFilter && selectedReviewFilter.value !== 'Review') {
          const reviewCount = parseInt(selectedReviewFilter.value);
          results = results.filter(professor =>
            professor.commentData && professor.commentData.length >= reviewCount
          );
        }

        sortResults(results, selectedSortOption.value);
        setSearchResults(results);

        const difficultyRatings = results.map((professor) => professor.difficultyRating || 0);
        const averageRating =
          difficultyRatings.length > 0
            ? difficultyRatings.reduce((acc, val) => acc + val) / difficultyRatings.length
            : null;
        setAverageDifficultyRating(averageRating);

        console.log("No results found:", results.length === 0);
      } 
      catch (error) {
        console.error("Error fetching professors:", error);
      }
      finally {
        setLoading(false);
      }
    };

    if (searchTerm) {
      fetchProfessors();
    } else {
      setSearchResults([]);
      setAverageDifficultyRating(null);
      setLoading(false);
    }
  }, [searchTerm, selectedDepartments, selectedReviewFilter, selectedRatingFilter, selectedSortOption]);

  const sortResults = (results, sortOption) => {
    if (sortOption === "Last Name") {
      results.sort((a, b) => a.lastName.localeCompare(b.lastName));
    } else if(sortOption === "First Name") {
      results.sort((a, b) => a.firstName.localeCompare(b.firstName));
    } else if (sortOption === "Highest Rating") {
      results.sort((a, b) => (b.difficultyRating || 0) - (a.difficultyRating || 0));
    } else if (sortOption === "Most Reviews") {
      results.sort((a, b) => (b.commentData?.length || 0) - (a.commentData?.length || 0));
    }
  };

  const handleProfessorClick = (profID) => {
    history.push(`/search/professors/${profID}`);
  };

  const handleRatingFilterClick = (option) => {
    setSelectedRatingFilter(option);
  };

  const handleReviewFilterClick = (option) => {
    setSelectedReviewFilter(option);
  };

  const handleDepartmentChange = (event) => {
    const value = event.target.value;
    if (value === '') {
      setSelectedDepartments([]);
    } else {
      setSelectedDepartments((prevSelected) =>
        prevSelected.includes(value)
          ? prevSelected.filter((dept) => dept !== value)
          : [...prevSelected, value]
      );
    }
  };

  const controlMovingDiv = () => {
    if (windowWidth >= 1020) {
      const boxRightBottomY = (boxRightRef.current?.offsetHeight + boxRightRef.current?.offsetTop);
      const stopPosition = boxRightBottomY - movingDivRef.current?.offsetHeight - 20;
      if (typeof window !== 'undefined') {
        if (window.scrollY + 340 > stopPosition) {
          setStop(true);
        } else {
          setStop(false);
        }
      }
    } else {
      setStop(true);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener("scroll", controlMovingDiv);
      return () => {
        window.removeEventListener('scroll', controlMovingDiv);
      };
    }
  }, [windowWidth]); 

  return (
    <div className="search-result-outter-wrap">
      <div className="search-result-wrap" ref={dropdownRef}>
        <div className="searchTermInfo">
          {searchTerm && (
            <h2>
              {searchResults.length} professor{searchResults.length !== 1 ? "s" : ""} with "<strong style={{ color: '#008938' }}>{searchTerm}</strong>" in their name
            </h2>
          )}
        </div>
        {windowWidth < 840 ? (
          <div className="mobile-filter-wrap">
            <div className="mobile-filter-inner-top">
              <Dropdown
                sortOptions={sortOptions}
                selectedSortOption={selectedSortOption} 
                handleSortChange={handleSortChange}
                onClick={() => handleDropdownClick('sort')}
                isMobile={true}
              />
              <Dropdown
                sortOptions={ratingOptions}
                selectedSortOption={selectedRatingFilter}
                handleSortChange={handleRatingFilterClick}
                onClick={() => handleDropdownClick('rating')}
                isMobile={true}
              />
              <Dropdown
                sortOptions={reviewOptions}
                selectedSortOption={selectedReviewFilter}
                handleSortChange={handleReviewFilterClick}
                onClick={() => handleDropdownClick('review')}
                isMobile={true}
              />
            </div>
            <div className="mobile-filter-inner-bot">
              <Dropdown
                sortOptions={[
                  { id: 0, value: "Select Department" },
                  ...departments.map((dept, index) => ({
                    id: index + 1,
                    value: capitalizeFirstLetter(dept),
                  })),
                ]}
                selectedSortOption={{
                  id: selectedDepartments.length
                    ? selectedDepartments.map((_, index) => index + 1).join(',')
                    : 0,
                  value: selectedDepartments.join(', ') || "Select Department",
                }}
                handleSortChange={(dept) => {
                  if (dept.id === 0) {
                    handleDepartmentChange({ target: { value: '' } });
                  } else {
                    handleDepartmentChange({ target: { value: departments[dept.id - 1] } });
                  }
                }}
                className="department-filter"
                onClick={() => handleDropdownClick('department')}
                isMobile={false}
              />
            </div>
          </div>
        ) : (
          <div className="desktop-filter-wrap">
            <div className="desktop-filter-inner-top">
              <Dropdown
                sortOptions={sortOptions}
                selectedSortOption={selectedSortOption} 
                handleSortChange={handleSortChange}
                onClick={() => handleDropdownClick('sort')}
              />
              <Dropdown
                sortOptions={ratingOptions}
                selectedSortOption={selectedRatingFilter}
                handleSortChange={handleRatingFilterClick}
                onClick={() => handleDropdownClick('rating')}
              />
              <Dropdown
                sortOptions={reviewOptions}
                selectedSortOption={selectedReviewFilter}
                handleSortChange={handleReviewFilterClick}
                onClick={() => handleDropdownClick('review')}
              />
            </div>
            <div className="desktop-filter-inner-bot">
              <Dropdown
                sortOptions={[
                  { id: 0, value: "Select Department" },
                  ...departments.map((dept, index) => ({
                    id: index + 1,
                    value: capitalizeFirstLetter(dept),
                  })),
                ]}
                selectedSortOption={{
                  id: selectedDepartments.length
                    ? selectedDepartments.map((_, index) => index + 1).join(',')
                    : 0,
                  value: selectedDepartments.join(', ') || "Select Department",
                }}
                handleSortChange={(dept) => {
                  if (dept.id === 0) {
                    handleDepartmentChange({ target: { value: '' } });
                  } else {
                    handleDepartmentChange({ target: { value: departments[dept.id - 1] } });
                  }
                }}
                className="department-filter"
                onClick={() => handleDropdownClick('department')}
                isMobile={false}
              />
            </div>
          </div>
        )}

        <div className="searchResults">
          <div className="prof-wrap">
            {loading ? (
              <div className="skeleton-container">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="skeleton-card">
                    <div className="skeleto-outer-wrap">


                      <div className="skeleton-profileImage" />
                      <div className="skeleton-text-wrap">
                        <div className="skeleton-text skeleton-name" />
                        <div className="skeleton-text skeleton-department" />
                        <div className="skeleton-text skeleton-school" />
                      </div>
                    </div>                    
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {searchResults.slice(0, displayedProfessors).map((professor, index) => (
                  <div key={index} className="item-wrap">
                    <div
                      className="professor"
                      onClick={() => handleProfessorClick(professor.id)}
                    >
                      <div className="profileImage-wrap">
                        {professor.profileImage ? (
                          <img
                            src={professor.profileImage}
                            alt={`${professor.firstName} ${professor.lastName}`}
                          />
                        ) : (
                          <img src={defaultProfileImage} alt="Default Profile" />
                        )}
                      </div>
                      <div className="prof-content">
                        <div className="infoHeader">
                          <div className="professorName">
                            {professor.firstName} {professor.lastName}
                          </div>
                          <div className="rating-score">
                            <Rating
                              precision={0.20}
                              value={
                                professor.commentData && professor.commentData.length > 0
                                  ? (
                                      professor.commentData.reduce(
                                        (acc, comment) =>
                                          acc + parseFloat(comment.difficultyRating || 0),
                                        0
                                      ) / professor.commentData.length
                                    ).toFixed(1)
                                  : 0
                              }
                              max={5}
                              size="large"
                              readOnly
                              icon={<StarRoundedIcon fontSize="inherit" />}
                              emptyIcon={<StarBorderRoundedIcon style={{ opacity: 1, color: '#dee3dd' } } fontSize="inherit" />}
                              style={{
                                color: getStarColor(
                                  (
                                    professor.commentData.reduce(
                                      (acc, comment) =>
                                        acc + parseFloat(comment.difficultyRating || 0),
                                      0
                                    ) / professor.commentData.length
                                  ).toFixed(1)
                                ),
                              }}
                            />
                          </div>
                        </div>
                        <div className="department">{professor.department}</div>
                        <div className="infoFooter">
                          <div className="schoolName">{professor.schoolName}</div>
                          <div className="reviewCommentLength">
                            {professor.commentData?.length || 0}{" "}
                            {professor.commentData?.length > 1 ? "reviews" : "review"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {displayedProfessors >= searchResults.length && (
                  <div className="end-of-results">
                    
                  </div>
                )}
              </>
            )  : (
              <div className="no-result">
                <div className="text-a">
                  Hmm... no professor profiles match '<strong style={{ color: '#008938' }}>{searchTerm}</strong>'
                </div>
                <div className="text-b">
                  Try checking the spelling or use different keywords to refine your search.
                </div>
              </div>
            )}

            {/* {!loadingMore && !loading && displayedProfessors < searchResults.length && (
              <div className="loading-spinner loadMore">
                <div className="spinner"></div>
              </div>
            )} */}
            {displayedProfessors >= searchResults.length && <div className="empty-div" />}
          </div>
        </div>
      </div>
      {isWideScreen && <RightSideBar />}
    </div>
  );
};

export default SearchResults;
