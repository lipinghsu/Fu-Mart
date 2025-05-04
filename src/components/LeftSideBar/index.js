import React, { useEffect, useState } from 'react';
import homeIcon from '../../assets/home-icon.png';
import SidebarItem from '../SideBarItem';
import './LeftSideBar.scss'

const LeftSideBar = () => {
   
    return (
        //add a wrap and make the inner content a moving sticky div
        <div className="sidebar-left">
            <SidebarItem icon={homeIcon} label={"Home"} link="/"/>

        </div>
    );
};

export default LeftSideBar;