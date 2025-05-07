import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import Header from './../../components/Header';
import './Terms.scss'; 
import '../../App.scss'; 

const Terms = () => {
    const { t } = useTranslation(['privacy', 'common']);
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // ensure we always have an array for lists
    const getArray = (key) => {
        const result = t(key, { returnObjects: true });
        if (Array.isArray(result)) 
            return result;
        console.warn(`Expected array for ${key}, but got:`, result);
        return [];
    };
    return (
        <div className="cg-root">
            <Header title={t('termsTitle')} subtitle={t('lastUpdated')} />


            <div className="cg-main terms-content">
                <section>
                    <h2>1. <span>{t('terms.section1Title')}</span></h2>
                    <p>{t('terms.section1Text')}</p>
                </section>

                <section>
                    <h2>2. <span>{t('terms.section2Title')}</span></h2>
                    <p>{t('terms.section2Text')}</p>
                </section>

                <section>
                    <h2>3. <span>{t('terms.section3Title')}</span></h2>
                    <p>{t('terms.section3Intro')}</p>
                    <ul>
                        {getArray('terms.section3List').map((item, idx) => (
                        <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2>4. <span>{t('terms.section4Title')}</span></h2>
                    <p>{t('terms.section4Text')}</p>
                </section>

                <section>
                    <h2>5. <span>{t('terms.section5Title')}</span></h2>
                    <p>{t('terms.section5Text')}</p>
                </section>

                <section>
                    <h2>6. <span>{t('terms.section6Title')}</span></h2>
                    <p>{t('terms.section6Text')}</p>
                </section>

                <section>
                    <h2>7. <span>{t('terms.section7Title')}</span></h2>
                    <p>{t('terms.section7Text')}</p>
                </section>
            </div>
        </div>
    );
};

export default Terms;
