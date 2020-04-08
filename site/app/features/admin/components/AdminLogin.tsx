import React from 'react';

import {compose, withCallback} from '@truefit/bach';
import {withActions} from '@truefit/bach-redux';
import {withForm, FormContextValues} from '@truefit/bach-react-hook-form';
import {withStyles} from '@truefit/bach-material-ui';

import {FormContext} from 'react-hook-form';
import {CSSProperties} from '@material-ui/styles';
import {Button} from '@material-ui/core';
import {HookFormTextField, HookFormPasswordField} from '../../forms/components';

import {authorizeUser} from '../actions';

type FormValues = {
  username: string;
  password: string;
};

type Props = {
  classes: {
    container: string;
    formContainer: string;
    button: string;
  };

  onSubmit: (formValues: FormValues) => void;
  formContext: FormContextValues<FormValues>;

  authorizeUser: (username: string, password: string) => void;
};

const Login = ({classes, onSubmit, formContext}: Props) => {
  return (
    <div className={classes.container}>
      <FormContext {...formContext}>
        <form className={classes.formContainer} onSubmit={formContext.handleSubmit(onSubmit)}>
          <HookFormTextField name="username" label="User Name" />
          <HookFormPasswordField name="password" label="Password" />
          <Button className={classes.button} type="submit" variant="contained" color="primary">
            Submit
          </Button>
        </form>
      </FormContext>
    </div>
  );
};

const onSubmit = ({authorizeUser}: Props) => ({username, password}: FormValues) => {
  authorizeUser(username, password);
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
  },

  formContainer: {
    maxWidth: 600,
  },

  button: {
    float: 'right',
    marginTop: 12,
  } as CSSProperties,
};

export default compose(
  withForm<FormValues>(),

  withActions({authorizeUser}),
  withCallback('onSubmit', onSubmit),

  withStyles(styles),
)(Login);
