import React, { useState, useRef, useEffect } from "react";
import { useHistory } from "react-router-dom"; // React Router v5
import upArrow from "../../../assets/arrow-up.png";
import './DropDown.scss';

const Dropdown = ({ isMobile, sortOptions, selectedSortOption, handleSortChange, className }) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const history = useHistory(); // Use history instead of useNavigate
  const [dropDownClicked, setDropDownClicked] = useState(false);
  const dropdownRef = useRef(null);
  const toggleDropdown = () => {
    setDropDownClicked(true);
    setIsDropdownVisible(!isDropdownVisible);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownVisible(false);
    }
  };

  const handleSortOptionChange = (option) => {
    handleSortChange(option);

    // Update the URL with the selected filter option
    const urlSearchParams = new URLSearchParams(window.location.search);
    // setCurrentValueURL(urlSearchParams + "");
    urlSearchParams.set('sort', option.value); 
    history.push(`?${urlSearchParams.toString()}`);
  };

  return (
    <div
      className={`filter-dropdown 
                  ${(selectedSortOption.id === 0) ? '' : ' sortActive '}
                  ${isDropdownVisible ? ' visible ' : ''} 
                  ${className ? className : ''}                  
                  ${isMobile ? 'mobile' : ''}`}
      onClick={toggleDropdown}
      ref= {dropdownRef}
    >
      <div className="dropdown-label">
        {selectedSortOption.value}
        {/* {selectedSortOption.id} */}
      </div>
      
      <img
        src={upArrow}
        alt="Toggle Dropdown"
        className={`arrow-icon ${selectedSortOption.id === 0 ? '' : ' active '} ${isDropdownVisible ? 'rotated' : ''}`}
      />
      <div className={isDropdownVisible ? "sort-options active" : "sort-options"}>
        {sortOptions.map((option) => (
          <div
            key={option.id}
            className={`sort-option ${
              String(selectedSortOption.id)
                .split(',')
                .map(Number)
                .includes(option.id)
                ? 'selected'
                : ''
            }`}
            onClick={() => handleSortOptionChange(option)}
          >
            <input
              type="radio"
              checked={String(selectedSortOption.id)
                .split(',')
                .map(Number)
                .includes(option.id)}
              onChange={() => handleSortOptionChange(option)}
            />
            <label>{option.value} </label>
            {/* <label>{option.value} {option.id}</label> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dropdown;
