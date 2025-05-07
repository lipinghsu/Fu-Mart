import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import Header from './../../components/Header';
import './Privacy.scss';
import '../../App.scss';

const Privacy = () => {
  const { t } = useTranslation(['privacy', 'common']);

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
      <Header title={t('privacyTitle')} subtitle={t('lastUpdated')} />

      <div className="cg-main privacy-content">
        <section>
          <h2>1. <span>{t('privacy.section1Title')}</span></h2>
          <p>{t('privacy.section1Text')}</p>
        </section>

        <section>
          <h2>2. <span>{t('privacy.section2Title')}</span></h2>
          <p>{t('privacy.section2Intro')}</p>
          <ul>
            {getArray('privacy.section2List').map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>3. <span>{t('privacy.section3Title')}</span></h2>
          <p>{t('privacy.section3Intro')}</p>
          <ul>
            {getArray('privacy.section3List').map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>4. <span>{t('privacy.section4Title')}</span></h2>
          <p>{t('privacy.section4Text')}</p>
        </section>

        <section>
          <h2>5. <span>{t('privacy.section5Title')}</span></h2>
          <p>{t('privacy.section5Text')}</p>
        </section>

        <section>
          <h2>6. <span>{t('privacy.section6Title')}</span></h2>
          <p>{t('privacy.section6Text')}</p>
        </section>

        <section>
          <h2>7. <span>{t('privacy.section7Title')}</span></h2>
          <p>{t('privacy.section7Text')}</p>
        </section>

        <section>
          <h2>8. <span>{t('privacy.section8Title')}</span></h2>
          <p>{t('privacy.section8Text')}</p>
        </section>

        <section>
          <h2>9. <span>{t('privacy.section9Title')}</span></h2>
          <p>{t('privacy.section9Text')}</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
