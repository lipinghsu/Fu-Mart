import React from 'react';

// --- CSS Styles ---
// We embed the styles here for a single-file example.
// In a real app, you'd move this to a separate .css file
// and import it (e.g., import './FuMartLoader.css').
const styles = `
.fu-mart-loader-body-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px; /* Give it some space */
    background-color: #f0f0f0;
    font-family: Arial, sans-serif;
    overflow: hidden;
}

.fu-mart-loader-container {
    display: flex;
    perspective: 400px;
}

.fu-mart-loader-char {
    font-size: 5rem;
    font-weight: bold;
    color: #D90429; /* fu mart red */
    margin: 0 5px;
    
    /* Start each letter as invisible and flipped */
    opacity: 0;
    transform: rotateX(90deg);
    
    /* Apply the animation */
    animation-name: flipIn;
    animation-duration: 0.6s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards; /* Stays at the end state */
}

@keyframes flipIn {
    0% {
        transform: rotateX(90deg);
        opacity: 0;
    }
    60% {
        transform: rotateX(-10deg); /* "Bounce" effect */
        opacity: 1;
    }
    100% {
        transform: rotateX(0deg);
        opacity: 1;
    }
}
`;

/**
 * A "split-flap" style loading animation component.
 * @param {object} props
 * @param {string} props.text - The text to animate.
 */
const FuMartLoader = ({ text }) => {
    // Split the text string into an array of characters
    const chars = text.split('');

    return (
        <>
            {/* Inject the styles into the document head */}
            <style>{styles}</style>
            
            {/* This outer div is just to demo the centering */}
            <div className="fu-mart-loader-body-container">
                <div className="fu-mart-loader-container">
                    {/* Map over the character array to create a <span> for each */}
                    {chars.map((char, index) => (
                        <span
                            key={index}
                            className="fu-mart-loader-char"
                            style={{ 
                                // This is the most important part:
                                // Stagger the animation delay for each letter
                                animationDelay: `${index * 100}ms` 
                            }}
                        >
                            {/* Use a non-breaking space for space characters */}
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </div>
            </div>
        </>
    );
};

export default FuMartLoader;