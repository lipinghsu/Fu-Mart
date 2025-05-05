import React from 'react';
import Directory from '../../components/Directory';
import './styles.scss';

const Homepage = ({ showSignupDropdown, setShowSignupDropdown }) => {
  return (
    <section className='homepage'>
        {/* <>hello</> */}
       <Directory showSignupDropdown={showSignupDropdown} setShowSignupDropdown={setShowSignupDropdown} />
    </section>
    
  );
};

export default Homepage;