import React from 'react';

import {compose, withCallback, withState} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';
import {withForm} from '@truefit/bach-react-hook-form';
import {renderIf} from '@truefit/bach-recompose';

import {FormContext, FormContextValues} from 'react-hook-form';
import {CSSProperties} from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';

import {getUnixTime} from 'date-fns/esm';

import {Link} from '../../link/types';
import {HookFormTextField} from '../../forms/components';
import {Loading} from '../../shared/components';

import {lookupUrl, saveLink, cleanTags} from '../services';
import {
  withSnackbar,
  EnqueueSnackbarFunction,
  EnqueueSnackbarVariant,
} from '../../shared/enhancers';

type FormValues = {
  id?: string;
  url: string;
  title: string;
  description: string;
  tags: string;
  image: string;
};

type Props = {
  classes: {
    container: string;
    formContainer: string;
    saveButton: string;

    urlContainer: string;
  };

  formContext: FormContextValues<FormValues>;

  loading: boolean;
  setLoading: (flag: boolean) => void;

  handleLookup: () => void;
  handleSubmit: (values: FormValues) => void;

  enqueueSnackbar: EnqueueSnackbarFunction;
};

type DetailProps = {
  loading: boolean;
};

const isLoading = ({loading}: DetailProps) => loading;

const DetailFields = compose<DetailProps>(renderIf(isLoading, Loading))(() => (
  <>
    <HookFormTextField name="title" label="Title" />
    <HookFormTextField name="description" label="Description" />
    <HookFormTextField name="tags" label="Tags" />
    <HookFormTextField name="image" label="Image" />
  </>
));

const Admin = ({classes, formContext, handleSubmit, handleLookup, loading}: Props) => (
  <div className={classes.container}>
    <FormContext {...formContext}>
      <form className={classes.formContainer} onSubmit={formContext.handleSubmit(handleSubmit)}>
        <input type="hidden" name="id" ref={formContext.register} />
        <div className={classes.urlContainer}>
          <HookFormTextField name="url" label="Url" />
          <IconButton onClick={handleLookup}>
            <SearchIcon color="primary" />
          </IconButton>
        </div>

        <DetailFields loading={loading} />

        <Button className={classes.saveButton} type="submit" variant="contained" color="primary">
          Save
        </Button>
      </form>
    </FormContext>
  </div>
);

const updateForm = (setValue: (key: string, value: unknown) => void, link: Link) => {
  setValue('id', link.id);
  setValue('title', link.title);
  setValue('description', link.description);
  setValue('tags', link.tags.join(', '));
  setValue('image', link.image);
};

const handleLookup = ({formContext: {getValues, setValue}, setLoading}: Props) => async () => {
  setLoading(true);

  const values = getValues();
  const link = await lookupUrl(values.url);

  setLoading(false);

  if (link) {
    updateForm(setValue, link);
  }
};

const handleSubmit = ({enqueueSnackbar, formContext: {setValue}}: Props) => async (
  values: FormValues,
) => {
  try {
    const updatedLink = await saveLink({
      id: values.id,
      url: values.url,
      title: values.title,
      description: values.description,
      tags: cleanTags(values.tags),
      image: values.image,
      date: getUnixTime(new Date()),
    });

    updateForm(setValue, updatedLink);

    enqueueSnackbar(`${values.title} saved.`, {
      variant: EnqueueSnackbarVariant.Success,
      autoHideDuration: 2500,
    });
  } catch (err) {
    enqueueSnackbar(`Save of ${values.title} failed.`, {
      variant: EnqueueSnackbarVariant.Error,
      autoHideDuration: 2500,
    });

    console.error(err); // eslint-disable-line
  }
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  formContainer: {
    width: '90%',
    maxWidth: 600,
  },

  saveButton: {
    float: 'right',
    marginTop: 12,
  } as CSSProperties,

  urlContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  } as CSSProperties,
};

export default compose(
  withForm(),
  withSnackbar(),

  withState('loading', 'setLoading', false),

  withCallback('handleLookup', handleLookup),
  withCallback('handleSubmit', handleSubmit),

  withStyles(styles),
)(Admin);
