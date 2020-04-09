import React from 'react';

import Header from './Header';
import {LinkList, LoadMore} from '../../link/components';

const Main = () => (
  <div>
    <Header />
    <LinkList />
    <LoadMore />
  </div>
);

export default Main;
