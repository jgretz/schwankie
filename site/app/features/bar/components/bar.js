import React from 'react';
import {Link} from 'react-router-dom';
import {Menu, Search} from './controls';
import {ROUTES} from '../../shared/constants';

export default () => (
  <div className="bar">
    <Link to={ROUTES.home.route} className="logo">
      <img src="../../../images/logo.png" />
    </Link>
    <Menu />
    <Search />
  </div>
);
