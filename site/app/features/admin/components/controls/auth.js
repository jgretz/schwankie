import React from 'react';
import {Button, Form} from 'semantic-ui-react';
import {connect} from 'react-redux';

import {updateAuthForm, login, clearAuthForm} from '../../actions';
import {authSelector} from '../../selectors';

const handleChange = (field, updateAuthForm) => event => {
  updateAuthForm(field, event.target.value);
};

const handleLogin = (auth, login, clearAuthForm) => () => {
  login(auth.toJS());
  clearAuthForm();
};

const authForm = ({auth, updateAuthForm, login, clearAuthForm}) => (
  <Form className="auth">
    <Form.Field>
      <label>User:</label>
      <input placeholder="user" value={auth.user} onChange={handleChange('user', updateAuthForm)} />
    </Form.Field>
    <Form.Field>
      <label>Password:</label>
      <input placeholder="password" type="password" value={auth.password} onChange={handleChange('password', updateAuthForm)} />
    </Form.Field>
    <Button type="submit" onClick={handleLogin(auth, login, clearAuthForm)}>Login</Button>
  </Form>
);

const mapStateToProps = state => ({
  auth: authSelector(state),
});

export default connect(mapStateToProps, {updateAuthForm, login, clearAuthForm})(authForm);
