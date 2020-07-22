import React from 'react';

import './MobileNavigation.css';

const mobileNavigation = props => (
  <nav className={['mobile-nav', props.open ? 'open' : ''].join(' ')}>
    <ul
      className={['mobile-nav__items', props.mobile ? 'mobile' : ''].join(' ')}
    >
    </ul>
  </nav>
);

export default mobileNavigation;
