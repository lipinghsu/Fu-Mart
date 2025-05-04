import React, { useState, useEffect, useRef } from 'react';
import { useHistory, Link } from 'react-router-dom';
import polyfica_text from './../../assets/polyfica_logo.png';
import { LuSearch, LuArrowRight } from 'react-icons/lu';
import { firestore } from '../../firebase/utils';
import defaultProfileImage from "../../assets/defaultProfImage.png";
import insertArrow from '../../assets/arrow-insert.png';
import './styles.scss';

const Directory = ({ showSignupDropdown }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const searchBarRef = useRef(null);
  const history = useHistory();
  const dynamicTextRef = useRef(null); 
  const rateText = "Rate a";
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const innerWrapRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const searchInputRef = useRef(null);
  const [bgColor, setBgColor] = useState('#008938');
  // const colors = ['#008938', '#98D602', '#F1B801', '#FF5D3A', '#000000'];
  const colors = ['#008938'];

  // change lbd banner color every 5.5 seconds
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setBgColor((prevColor) => {
  //       const currentIndex = colors.indexOf(prevColor);
  //       const nextIndex = (currentIndex + 1) % colors.length;
  //       return colors[nextIndex];
  //     });
  //   }, 2500);
  
  //   return () => clearInterval(interval); // cleanup
  // }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });


  }, [searchTerm]);

  useEffect(() => {
    if (isSearchFocused) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [isSearchFocused]);

  // Set a CSS variable for the mobile viewport height
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };  
    setVh();
    window.addEventListener('resize', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, []);

  const phrases = [
    " Professor",
    " Lab Instructor",
    " Research Advisor",
    " Teaching Assistant",
    "n Academic Advisor",
    " Department Chair",
    " Dean",
    " Janitor",
    "ny Faculty and Staff",
  ];
  
  useEffect(() => {
    let charIndex = 0;
    let currentPhrase = 0;
    let typingTimeout = 0;
    let deletingTimeout = 0;
    const element = dynamicTextRef.current;
  
    const replaceSpacesWithNbsp = (text) => {
      return text.replace(/ /g, "&nbsp;");
    };
  
    const typePhrase = () => {
      const currentText = phrases[currentPhrase];
      if (charIndex < currentText.length + 1) {
        // Replace spaces with &nbsp; when updating innerHTML
        element.innerHTML = `${replaceSpacesWithNbsp(currentText.substring(0, charIndex))}<span class="cursor"></span>`;
        charIndex++;
        typingTimeout = setTimeout(typePhrase, 75); // Typing speed
      } else {
        deletingTimeout = setTimeout(deletePhrase, 2000); // Wait before deleting
      }
    };
  
    const deletePhrase = () => {
      const currentText = phrases[currentPhrase];
      if (charIndex > 0) {
        // Replace spaces with &nbsp; when updating innerHTML
        element.innerHTML = `${replaceSpacesWithNbsp(currentText.substring(0, charIndex - 1))}<span class="cursor"></span>`;
        charIndex--;
        deletingTimeout = setTimeout(deletePhrase, 75); // Deleting speed
      } else {
        currentPhrase = (currentPhrase + 1) % phrases.length; // Cycle to next phrase
        typingTimeout = setTimeout(typePhrase, 500);
      }
    };
    typePhrase();
  
    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(deletingTimeout);
    };
  }, []);


  const handleSearchEnter = (e) => {
    if (e.key === 'Enter' && searchTerm.length > 0) {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        history.push(`/search/professors/${suggestions[activeSuggestionIndex].profID}`);
      } else {
        history.push(`/search/professors?term=${searchTerm}`);
      }
    } else if (e.key === 'ArrowDown') {
      setActiveSuggestionIndex((prevIndex) =>
        prevIndex < suggestions.length ? prevIndex + 1 : -1
      );
    } else if (e.key === 'ArrowUp') {
      setActiveSuggestionIndex((prevIndex) =>
        prevIndex > -1 ? prevIndex - 1 : suggestions.length
      );
    }
  };

  const handleSearchClick = () => {
    if (searchTerm.length > 0) {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        history.push(`/search/professors/${suggestions[activeSuggestionIndex].profID}`);
      } else {
        history.push(`/search/professors?term=${searchTerm}`);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
  };

  const handleFocus = () => {
    setIsSearchFocused(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
      }
    };
  
    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchFocused]);

  
  // Focus the search input when the component mounts
  useEffect(() => {
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);


  //fetch professor suggestions from the database
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        if (!searchTerm || searchTerm.length < 1) {
          setSuggestions([]);
          return;
        }
  
        setSuggestionsLoading(true); // Start loading state
  
        const professorsRef = firestore.collection("professors");
        let suggestions = [];
        const searchTerms = searchTerm.toLowerCase().split(" ");
  
        const allProfessorsSnapshot = await professorsRef.get();
        let allProfessors = [];
        allProfessorsSnapshot.forEach((doc) => allProfessors.push({ id: doc.id, ...doc.data() }));
  
        suggestions = allProfessors.filter(professor =>
          searchTerms.some(term =>
            professor.firstName.toLowerCase().includes(term) ||
            professor.lastName.toLowerCase().includes(term)
          )
        );
        suggestions = suggestions.slice(0, 5);
        setSuggestions(suggestions);
        setSuggestionsLoading(false);
      } 
      catch (error) {
        setSuggestions([]);
        setSuggestionsLoading(false);
      }
    };
  
    if (searchTerm) {
      fetchSuggestions();
    } 
    else {
      setSuggestions([]);
    }
  }, [searchTerm, isSearchFocused]);
  
  const highlightMatch = (text, searchTerm) => {
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? <strong key={index}>{part}</strong> : part
    );
  };

  return (
    <div className='directory'>
      <div className='wrap'>
        <div
          className={`item ${(suggestions.length > 0 || searchTerm.length > 0) ? ' shifted' : ''}`}
          style={{ zIndex: isSearchFocused ? 1 : showSignupDropdown ? -1 : 0 }}
        >
          <div className={`inner-wrap`}>
            <div className={`polyfica_text ${windowWidth < 840 && (suggestions.length > 0 || searchTerm.length > 0) ? 'hide' : ''}`}>
              <img src={polyfica_text} alt='polyficaText' />
            </div>
            <div className={`search-wrapper ${isSticky ? 'sticky' : ''} ${(suggestions.length > 0 || searchTerm.length > 0) ? 'with-shadow' : ''}`}
                ref={innerWrapRef} 
              >
              <div className={`search-bar-block  ${searchTerm.length > 0 && !suggestionsLoading && isSearchFocused ? 'active' : ''}`}/>
              <div className={`search-bar ${isSearchFocused ? ' active' : ''} ${(suggestions.length > 0 || searchTerm.length > 0) ? ' no-shadow' : ''}`} ref={searchBarRef}>
                <div className={`search-input ${suggestions.length > 0 ? ' active' : ''}`}>
                  <LuSearch className='lu-search-icon-search-bar' />
                  <input
                    type='text'
                    value={searchTerm}
                    onKeyDown={handleSearchEnter}
                    placeholder='Search for a professor'
                    onFocus={handleFocus}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setActiveSuggestionIndex(-1);
                    }}
                    ref={searchInputRef}  // <-- Attach ref to the input element
                    className={`${suggestions.length > 0 ? 'active' : ''}`}
                  />
                  {searchTerm && (
                    <>
                      <div onClick={handleClearSearch} className='clear-button'>
                        CLEAR
                      </div>

                    </>
                  )}
                  <div onClick={handleSearchClick} className={`arrow-button ${searchTerm ? 'active' : ''}`}>
                    <LuArrowRight className='arrow-icon' />
                  </div>
                </div>
                
                <div className={`suggestions ${searchTerm.length > 0 && isSearchFocused && !suggestionsLoading ? 'active' : ''}`}>
                    {suggestions.map((professor, index) => (
                      <Link
                        to={`/search/professors/${professor.profID}`}
                        key={index}
                        className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''} ${searchTerm.length > 0 && isSearchFocused && !suggestionsLoading ? 'show' : ''}` }
                      >
                        <div className='profileImage-wrap'>
                          {professor.profileImage ? (
                          <img src={professor.profileImage} alt={`${professor.firstName} ${professor.lastName}`} />
                          ) : (
                          <img src={defaultProfileImage} alt="Default Profile" />
                          )}
                        </div>

                        <div className='right-wrap'>
                          <div className="professor-name">
                          {highlightMatch(`${professor.firstName} ${professor.lastName}`, searchTerm)}
                          </div>
                          <div className="professor-details">
                            <div className="professor-department">{professor.department}</div>
                            <div className="professor-schoolName">{professor.schoolName}</div>
                          </div>
                          
                        </div>
                        <img src={insertArrow} alt="Default Profile" className='arrow-img'/>
                      </Link>
                    ))}

                    {/* Add the last suggestion to search for the term */}
                    {searchTerm.length > 0 && isSearchFocused &&(
                    <div
                      className={`suggestion-item search-for ${activeSuggestionIndex === suggestions.length ? 'active' : ''}`}
                      onClick={() => {
                        if (searchTerm.length > 0) {
                          history.push(`/search/professors?term=${searchTerm}`);
                        }
                      }}
                    >
                      <div className='img-wrap'>
                        <LuSearch className='lu-search-icon-search-for' />
                        
                      </div>
                      Search for "<span className='highlighted-term'>{searchTerm}</span>"...
                    </div>
                    )}
                </div>
                
              </div>
            </div>
            <a>
              <div className='item-logo'/>
            </a>
            <div className='overlay'/>
            <div className='lbd' style={{ backgroundColor: bgColor }}>
              LEARN <span>BY</span> DOING
            </div>
          </div>
        </div>
        <div className="typing-banner-wrap">
          <div className="typing-banner">
            {rateText}
              <span className="dynamic-text" ref={dynamicTextRef}/> 
          </div>
        </div>
      </div>
    </div>
  );
};

export default Directory;
