import React from 'react';
import {Link} from 'react-router-dom';

export default () => (
  <div className="page-footer">
    <div> &copy; {new Date().getFullYear()}</div>
    <div>
      <Link to="/adminy">Admin</Link>
    </div>
  </div>
);
