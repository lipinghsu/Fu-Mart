import React from 'react';
import { Link } from 'react-router-dom';

const ConditionalLink = (props) => {
    const handleClick = (e) => {
        // props.setIsClicked(!props.isClicked)
        if (props.preventLink) {
            e.preventDefault();
            props.handleWriteReviewClick();
        }
    };

    return (
        <Link 
            to={props.link} 
            onClick={handleClick} 
            className= {props.navClassName}
            onMouseDown={() => props.setIsRevPressed(true)}
            onMouseUp={() => props.setIsRevPressed(false)}
            onMouseLeave={() => props.setIsRevPressed(false)}
            
            setIsRevPressed={props.setIsRevPressed}
        >
            {props.reviewButton ? 
            <span className="material-symbols-outlined">
                edit_square
            </span>
            :
            null
            }
            <span className={props.link ? ("text-button " + props.className) : "text-button"}>
                {props.text}
            </span>
        </Link>
    );
};

export default ConditionalLink;
