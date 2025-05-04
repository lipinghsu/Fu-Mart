import React from 'react';
import './styles.scss';

const FormInput = ({ handleChange, value, label, id, className, ...otherProps }) => {
    // Add a conditionally applied class for when the input is filled
    const inputClass = value ? `${className || 'formInput'} filled-input` : `${className || 'formInput'}`;

    return (
        <div className="formRow">
            {label && (
                <label 
                    className={!value ? "form-input-label" : "filled"}>
                    {label}
                </label>
            )}
            {className === "reviewComment" ? (
                <textarea
                    value={value}
                    className={inputClass}  
                    onChange={handleChange}
                    id={id}
                    {...otherProps}
                />
            ) : (
                <input
                    value={value}
                    className={inputClass} 
                    onChange={handleChange}
                    id={id}
                    {...otherProps}
                />
            )}
        </div>
    );
}

export default FormInput;
