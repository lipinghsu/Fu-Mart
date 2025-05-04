import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DropdownItem from './DropDownItem';
import aboutIcon from './../../../assets/aboutIcon2.png'
import signUpIcon from './../../../assets/signUpIcon2.png'
import addProfIcon from './../../../assets/addProfIcon2.png'
import './SignupDropdown.scss';

const SignupDropdown = (props) => {

    const [darkMode, setDarkMode] = useState(false);
    const handleClick = () => {
        if (props.label === "Log Out" && props.signOut) {
            props.signOut();
        }
    };

    return (
        <div className={`signup-dropdown ${props.showSignupDropdown ? ' open' : ''}`}>
            <div className={`dropdown-menu ${props.showSignupDropdown ? ' open' : ''}`}>
                {props.label === "Log Out" ?
                    <Link to="/" className="dropdown-item" onClick={""}>
                        Settings
                    </Link> 
                    : 
                    null
                }
                
                <DropdownItem 
                    label={"About"} 
                    link="/about" 
                    onClick={handleClick} 
                    isLogout={props.label === "Log Out"} 
                    icon = {aboutIcon}
                    className="about-icon"
                />
                <DropdownItem 
                    label={"Sign Up"} 
                    link="/registration" 
                    onClick={handleClick} 
                    isLogout={props.label === "Log Out"} 
                    icon={signUpIcon}
                    className="sign-up-icon"
                />

                <DropdownItem 
                    label={"Add a Professor"} 
                    link="/registration" 
                    onClick={handleClick} 
                    isLogout={props.label === "Log Out"} 
                    icon={addProfIcon}
                    className="add-prof-icon"
                />
                {/* <div className='light-dark-switch-wrap'>
                    <div 
                        className={`light-dark-switch ${darkMode ? 'dark-mode-on ' : ''}`}
                        onClick={() => setDarkMode(!darkMode)} 
                    >
                        <div className='switch-button'/>
                    </div>
                </div> */}

            </div>
        </div>
    );
};

export default SignupDropdown;
