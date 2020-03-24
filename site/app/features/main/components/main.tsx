import React from 'react';
import {compose, withEffect} from '@truefit/bach';
import {withActions} from '@truefit/bach-redux';
import {loadRecentLinks} from '../../link/actions';
import {LinkList} from '../../link/components';

type Props = {
  loadRecentLinks: () => void;
};

const Main = () => (
  <div>
    <LinkList />
  </div>
);

const loadEffect = ({loadRecentLinks}: Props) => {
  loadRecentLinks();
};

export default compose(withActions({loadRecentLinks}), withEffect(loadEffect, []))(Main);
