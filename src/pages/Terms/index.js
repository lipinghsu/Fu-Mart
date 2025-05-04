import React, { useEffect } from 'react';

import './styles.scss';

const Terms = props => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return (
        <section className='terms'>
            <div className='terms-detail'>
                <h3>Terms of Use</h3>
                <p>
                    Welcome to our professor review site. By using our platform, you agree to comply with and be bound by the following terms and conditions. Please review these terms carefully. If you do not agree to these terms, you should not use this site.
                </p>
            </div>
            <div className='terms-detail'>
                <h3>Content and Conduct</h3>
                <p>
                    Users are responsible for the content they post, including reviews and comments. All content must be respectful, truthful, and relevant to the purpose of reviewing professors. We reserve the right to remove any content that violates these guidelines.
                </p>
            </div>
            <div className='terms-detail'>
                <h3>Privacy Policy</h3>
                <p>
                    Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using our site, you consent to our privacy practices as outlined in the Privacy Policy.
                </p>
            </div>
            <div className='terms-detail'>
                <h3>Intellectual Property</h3>
                <p>
                    All content on this site, including text, graphics, logos, and software, is the property of our site or its content suppliers and is protected by international copyright laws. Unauthorized use of any content on this site is strictly prohibited.
                </p>
            </div>
            <div className='terms-detail'>
                <h3>Disclaimer of Warranties</h3>
                <p>
                    This site is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the operation or availability of the site, or the accuracy, reliability, or completeness of any information provided.
                </p>
            </div>
            <div className='terms-detail'>
                <h3>Limitation of Liability</h3>
                <p>
                    In no event shall our site be liable for any damages arising out of or in connection with your use of the site. This limitation of liability applies to all damages of any kind, including direct, indirect, incidental, punitive, and consequential damages.
                </p>
            </div>
            <div className='terms-detail'>
                <h3>Changes to Terms</h3>
                <p>
                    We reserve the right to modify these terms at any time. Any changes will be effective immediately upon posting. Your continued use of the site after any changes constitutes your acceptance of the new terms.
                </p>
            </div>
            <div className='terms-detail'>
                <h3>Contact Us</h3>
                <p>
                    If you have any questions, please send us a feedback.
                </p>
            </div>
        </section>
    );
};

export default Terms;
