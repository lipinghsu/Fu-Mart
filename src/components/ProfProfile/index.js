import React, { useEffect, useState } from 'react';
import { firestore, auth } from "../../firebase/utils";
import { Link, useParams, useHistory } from 'react-router-dom';

import './ProfProfile.scss';
import CommentItem from './CommentItem';
import ProfessorDetails from './ProfessorDetails';
import thinkingStan from '../../assets/thinking-stan2.png';
import Button from '../forms/Button';
import { useTranslation } from "react-i18next";

import LeftSideBar from '../LeftSideBar'
import RightSideBar from '../RightSideBar'


const ProfProfile = () => {
    const { profID } = useParams();
    const history = useHistory();
    const [professor, setProfessor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormComplete, setIsFormComplete] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 1100);
    const [isMediumScreen, setIsMediumScreen] = useState(window.innerWidth > 840);

    const { t } = useTranslation(["", "common"]);

    useEffect(() => {
        const handleResize = () => {
            setIsWideScreen(window.innerWidth > 1100);
            setIsMediumScreen(window.innerWidth > 840);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
      
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    const fetchProfessor = async () => {
        try {
            const professorRef = firestore.collection("professors").doc(profID);
            const doc = await professorRef.get();
            if (doc.exists) {
                setProfessor(doc.data());
            } else {
                console.log("No such professor with ID:", profID);
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching professor:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (profID) {
            fetchProfessor();
        }
    }, [profID]);


    return (
        <div className="content-wrap">
            {/* {isMediumScreen && (
                <>
                <LeftSideBar />
                </>
            )} */}
            {isLoading ? 
            (<div className="skeleton-loader">   
                <div className="skeleton-top-wrap">

                    <div className="skeleton-prof-detail">
                        <div className="skeleton-line name"></div>
                        <div className="skeleton-line detail top"></div>
                        <div className="skeleton-line detail bot"></div>
                        <div className="skeleton-line count"></div>
                        <div className="skeleton-line rev-btn"></div>
                    </div>

                    <div className="skeleton-profile-image">
                    </div>
                </div>

                <div className="skeleton-body">
                    <div className="skeleton-line content"></div>
                    <div className="skeleton-line content"></div>
                    <div className="skeleton-line content"></div>
                    <div className="skeleton-line content"></div>
                </div>
                
            </div>
            )
            : 
            (<div className="profProfile">
                <div className='profProfile-inner-wrap'>
                {professor && <ProfessorDetails professor={professor} />}
                <div className="profComments">
                    {/* <div className='pp-review-count'>
                        {professor?.commentData?.length > 0 ? professor.commentData.length : "Unknow number of"}
                        &nbsp;Student Rating
                    </div> */}
                    {professor?.commentData?.length > 0 ? (
                        professor.commentData.map((comment, index) => (
                            <CommentItem
                                key={index}
                                comment={comment}
                                currentUser={currentUser}
                                index={index}
                            />
                        ))
                    ) : (
                    <div className="no-comments">
                        <div className='image-wrap'>
                            <img src={thinkingStan} />
                        </div>
                        <div className='text-wrap'>
                            <div className='no-comments-title'>Be the first to review</div>
                            <div className='no-comments-text a'>Nobody's reviewed this professor yet.</div>
                            <div className='no-comments-text b'>Share your experience and help others find the right professor.</div>
                        </div>
                    </div>
                    )}
                </div>
                
                {professor?.commentData?.length > 0 ? (
                <div className='see-more'>
                    <div className='see-more-inner log-in-button'
                        onClick={() => window.location.href = '/login'}>
                        Log in for more info on Professor {professor.lastName.substring(0, 1)}.
                    </div>

                </div>
                    ) : <></>}
                </div>
            </div>)
            
            }

            {isWideScreen && (
                <RightSideBar/>
            )}
        </div>
    );
};

export default ProfProfile;