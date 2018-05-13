import _ from 'lodash';
import React from 'react';
import {Menu} from 'semantic-ui-react';
import {connect} from 'react-redux';
import {push} from 'react-router-redux';

import {activeRouteSelector} from '../../selectors';
import {ROUTES} from '../../../shared/constants';

const handleRouteClick = (route, push) => () => {
  push(route.route);
};

const siteMenu = ({activeRoute, push}) => {
  const items = _.values(ROUTES).map(x => ({
    ...x,
    onClick: handleRouteClick(x, push),
    active: x.route === activeRoute,
  }));

  return (
    <Menu items={items} secondary />
  );
};

const mapStateToProps = state => ({
  activeRoute: activeRouteSelector(state),
});

export default connect(mapStateToProps, {push})(siteMenu);