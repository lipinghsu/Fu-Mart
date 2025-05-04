import './SideBarItem.scss';
import { Link } from 'react-router-dom';

const SidebarItem = ({ icon, label, link }) => {
    const Wrapper = link ? Link : 'div';
    const wrapperProps = link ? { to: link } : {};

    return (
        <Wrapper className="list-item-wrap" {...wrapperProps}>
            <div className='img-wrap'>
                <img src={icon} alt={label} />
            </div>
            <div className='text-wrap'>
                {label}
            </div>
        </Wrapper>
    );
};

export default SidebarItem;