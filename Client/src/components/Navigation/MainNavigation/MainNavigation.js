import React from 'react';
import { NavLink } from 'react-router-dom';

import Logo from '../../Logo/Logo';

import './MainNavigation.css';

const mainNavigation = props => (
  <nav className="main-nav">
    <div className="main-nav__logo">
      <NavLink to="/">
        <Logo />
      </NavLink>
    </div>
    <div className="spacer" />
  </nav>
);

export default mainNavigation;
