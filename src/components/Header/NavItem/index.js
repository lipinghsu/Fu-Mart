import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './NavItem.scss';
const NavItem = (props) => {
  const [open, setOpen] = useState(false);
  const refOutsideDiv = useRef(null);
  const history = useHistory(); // For programmatic navigation

  useEffect(() => {
    const handleClickOutsideDiv = (e) => {
      if (!e.target.closest('.profile-image-button')) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("click", handleClickOutsideDiv, true);
    }
    return () => {
      document.removeEventListener("click", handleClickOutsideDiv);
    };
  }, [open]);

  const handleItemClick = () => {
    if (props.link) {
      history.push(props.link); // Navigate to the link
    }
    if (props.setSidebar) {
      props.setSidebar(false); // Close the sidebar
    }
  };

  return (
    <li 
      className={`nav-item ${props.className || ''}`} 
      onClick={handleItemClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onMouseLeave={props.onMouseLeave}
    >

      {/* not mobile, image */}
      {props.image && !props.mobile && (
        <div ref={refOutsideDiv} className="profile-image-button">
          <img
            src={props.image}
            alt="userProfilePicture"
            className={props.profileImageClass}
            onClick={() => setOpen(!open)}
          />
          {open && props.children}
        </div>
      )}
      {/* not mobile, text */}
      {props.text && !props.mobile && !props.signOut && (
        <div>
          {props.link ? (
            <Link to={props.link}>
              <span className="text-button">
                {props.text}
                {/* cart item number */}
                {props.number !== 0 && props.number && <span> ({props.number})</span>}
              </span>
            </Link>
          ) : (
            <div>
              <span className="text-button">
                {props.text}
                {/* cart item number */}
                {props.number !== 0 && props.number && <span> ({props.number})</span>}
              </span>
            </div>
          )}
        </div>
      )}

      {/* mobile, image (account) */}
      {props.image && props.mobile && (
        <div>
          <Link to={props.link}>
            <img
              src={props.image}
              alt="userProfilePicture"
              className={props.profileImageClass}
            />
            {props.children}
          </Link>
        </div>
      )}
      {/* mobile, text */}
      {props.text && props.mobile && (
        <div onClick={() => props.setSidebar(false)}>
          <Link to={props.link}>
            <span className="text-button">{props.text}</span>
          </Link>
        </div>
      )}

      {/* log out button */}
      {props.text === "Log out" && (
        <div className="nav-item-wrap" onClick={() => props.signOut()}>
          <Link to={props.link}>
            <span className="text-button">{props.text}</span>
          </Link>
        </div>
      )}
    </li>
  );
};

export default NavItem;
