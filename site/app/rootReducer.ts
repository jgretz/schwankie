/* eslint-disable sort-imports */
/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
import {combineReducers} from 'redux';


export type ApplicationState = {
  features: {
  };
};

const createRootReducer = () =>
  combineReducers({
    features: combineReducers({
    }),
  });

export default createRootReducer;
