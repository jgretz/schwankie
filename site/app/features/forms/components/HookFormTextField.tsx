import React, {ReactNode} from 'react';
import {FormHelperTextProps, InputLabelProps, TextField} from '@material-ui/core';
import {InputProps as StandardInputProps} from '@material-ui/core/Input/Input';
import {FilledInputProps} from '@material-ui/core/FilledInput';
import {OutlinedInputProps} from '@material-ui/core/OutlinedInput';
import {useFormContext} from 'react-hook-form';

type Props = {
  name: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  FormHelperTextProps?: Partial<FormHelperTextProps>;
  fullWidth?: boolean;
  helperText?: ReactNode;
  id?: string;
  InputLabelProps?: Partial<InputLabelProps>;
  InputProps?:
    | Partial<StandardInputProps>
    | Partial<FilledInputProps>
    | Partial<OutlinedInputProps>;
  label?: ReactNode;
  margin?: 'none' | 'dense' | 'normal';
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  rows?: string | number;
  rowsMax?: string | number;
  size?: 'small' | 'medium';
  type?: string;
  variant?: 'standard' | 'outlined' | 'filled';
};

export default ({
  name,
  autoComplete,
  autoFocus,
  disabled,
  FormHelperTextProps,
  fullWidth = true,
  helperText,
  id,
  InputLabelProps,
  InputProps,
  label,
  margin = 'normal',
  multiline,
  placeholder,
  required,
  rows,
  rowsMax,
  size,
  type,
  variant,
}: Props) => {
  const {register, errors} = useFormContext();
  const error = errors[name];
  const displayError = Boolean(error?.message);

  return (
    <TextField
      name={name}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      disabled={disabled}
      error={displayError}
      FormHelperTextProps={FormHelperTextProps}
      fullWidth={fullWidth}
      helperText={displayError ? error.message : helperText}
      id={id ?? name}
      InputLabelProps={InputLabelProps}
      InputProps={InputProps}
      inputRef={register}
      label={label}
      margin={margin}
      multiline={multiline}
      placeholder={placeholder}
      required={required}
      rows={rows}
      rowsMax={rowsMax}
      size={size}
      type={type}
      variant={variant}
    />
  );
};
