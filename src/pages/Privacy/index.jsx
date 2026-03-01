import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import Header from './../../components/Header';
import Footer from './../../components/Footer';
import './Privacy.scss';
import '../../App.scss';

const Privacy = () => {
  const { t } = useTranslation(['legal']);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ensure result is always an array
  const getArray = (key) => {
    const result = t(key, { returnObjects: true });
    if (Array.isArray(result)) return result;
    
    // debug: log unexpected cases
    console.warn(`Expected array for ${key}, but got:`, result); 
    return []; 
  };

  return (
    <div className="cg-root">
      <Header subtitle={t('privacy.lastUpdated')} />

      <div className="cg-main privacy-content">
        <div className="privacy-wrap">
          <section>
            <h2><span>{t('privacy.section1Title')}</span></h2>
            <p>{t('privacy.section1Text')}</p>
          </section>

          <section>
            <h2><span>{t('privacy.section2Title')}</span></h2>
            <p>{t('privacy.section2Intro')}</p>
            <ul>
              {getArray('privacy.section2List').map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2><span>{t('privacy.section3Title')}</span></h2>
            <p>{t('privacy.section3Intro')}</p>
            <ul>
              {getArray('privacy.section3List').map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2><span>{t('privacy.section4Title')}</span></h2>
            <p>{t('privacy.section4Text')}</p>
          </section>

          <section>
            <h2><span>{t('privacy.section5Title')}</span></h2>
            <p>{t('privacy.section5Text')}</p>
          </section>

          <section>
            <h2><span>{t('privacy.section6Title')}</span></h2>
            <p>{t('privacy.section6Text')}</p>
          </section>

          <section>
            <h2><span>{t('privacy.section7Title')}</span></h2>
            <p>{t('privacy.section7Text')}</p>
          </section>

          <section>
            <h2><span>{t('privacy.section8Title')}</span></h2>
            <p>{t('privacy.section8Text')}</p>
          </section>

          <section>
            <h2><span>{t('privacy.section9Title')}</span></h2>
            <p>{t('privacy.section9Text')}</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
