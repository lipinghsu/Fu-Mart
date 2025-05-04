import React, { useState, useRef } from 'react';
import './ProgressBar.scss';

const ProgressBar = ({ progress, setProgress }) => {
    const progressBarRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverPercentage, setHoverPercentage] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ left: 0 });

    // Calculate the percentage based on mouse position
    const calculateProgress = (clientX) => {
        if (!progressBarRef.current) return 0;
        const rect = progressBarRef.current.getBoundingClientRect();
        const newProgress = ((clientX - rect.left) / rect.width) * 100;
        return Math.min(100, Math.max(0, newProgress)); // Clamp between 0 and 100
    };

    // Mouse event handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        const newProgress = calculateProgress(e.clientX);
        setProgress(newProgress);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const newProgress = calculateProgress(e.clientX);
            // setProgress(newProgress);
        }
        // Calculate the hover percentage and update tooltip position
        const hoverProgress = calculateProgress(e.clientX);
        setHoverPercentage(hoverProgress.toFixed(0)); // Show whole number
        const rect = progressBarRef.current.getBoundingClientRect();
        const tooltipLeft = e.clientX - rect.left + rect.left; // Adjust position based on progress bar's left offset
        setTooltipPosition({ left: `${tooltipLeft}px` });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseEnter = () => {
        // Show tooltip on mouse enter
        setHoverPercentage(progress);
    };

    const handleMouseLeave = () => {
        // Hide tooltip on mouse leave
        setHoverPercentage(null);
    };

    return (
        <div 
            ref={progressBarRef} 
            className="about-progress-bar" 
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div 
                className="about-progress" 
                style={{ width: `${progress}%` }}
            />
            {hoverPercentage !== null && (
                <div 
                    className="hover-tooltip" 
                    style={{ left: tooltipPosition.left }}
                >
                    {hoverPercentage}%
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
