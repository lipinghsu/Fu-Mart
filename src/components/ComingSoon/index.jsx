import { useEffect } from "react";

import { useTranslation } from 'react-i18next';
import cornerImg from '../../assets/corner-image.jpg';
import Header from './../Header';

import "./ComingSoon.scss";

const ComingSoon = () => {
    const { t } = useTranslation(['comingsoon', 'common']);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="products">
            <Header 
                title={t('title')} 
                subtitle={t('cs-subtitle')} 
                comingSoonPage={true}
                hideMobileButtons = {true}
                
            />
            <div className="corner-decoration top-left">
                <img src={cornerImg} alt="Corner" />
            </div>
            <div className="corner-decoration top-right">
                <img src={cornerImg} alt="Corner" />
            </div>
            <div className="corner-decoration bottom-left">
                <img src={cornerImg} alt="Corner" />
            </div>
            <div className="corner-decoration bottom-right">
                <img src={cornerImg} alt="Corner" />
            </div>


            <div className="coming-soon-wrap">
                <div className="coming-soon-wrap-top">
                    <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                    <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                    <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                    <div className="coming-soon solid top-text">{t('comingSoon')}</div>
                    <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                    <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                    <div className="coming-soon outline top-text">{t('comingSoon')}</div>

                    <div className="coming-soon solid subtitle">{t('haveANiceDay')}</div>
                </div>
                <div className="coming-soon solid notice">{t('noticeTitle')}</div>
                <div className="coming-soon solid sub-text">{t('noticeDescription')}</div>
                <div className="coming-soon solid sub-text"></div>
                <div className="coming-soon solid subtitle ty">{t('thankYou')}</div>
            </div>
        </div>
    );
};

export default ComingSoon;
