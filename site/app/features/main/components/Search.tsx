import React, {ChangeEvent} from 'react';

import {compose, withMemo, withCallback} from '@truefit/bach';
import {withActions, withSelector} from '@truefit/bach-redux';
import {withStyles} from '@truefit/bach-material-ui';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import {Tag} from '../../tag/types';
import {getTagSuggestions} from '../../tag/actions';
import {tagSuggestionsSelector} from '../../tag/selectors';

type Props = {
  classes: {
    container: string;
  };

  tags: Tag[];
  tagTitles: string[];

  getTagSuggestions: (term: string) => void;
  onSearchTextChanged: (e: ChangeEvent<HTMLInputElement>) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeSearchField = (onSearchTextChanged: (e: ChangeEvent<HTMLInputElement>) => void) => (
  params: any,
) => (
  <TextField
    {...params}
    label="Search"
    margin="normal"
    variant="filled"
    onChange={onSearchTextChanged}
    InputProps={{...params.InputProps, type: 'search'}}
  />
);

const Search = ({classes, tagTitles, onSearchTextChanged}: Props) => (
  <div className={classes.container}>
    <Autocomplete
      id="search-tags"
      freeSolo
      disableClearable
      options={tagTitles}
      renderInput={makeSearchField(onSearchTextChanged)}
    />
  </div>
);

// handlers
const makeTagTitles = ({tags}: Props) => tags.map((t) => t.title);

const onSearchTextChanged = ({getTagSuggestions}: Props) => (e: ChangeEvent<HTMLInputElement>) => {
  getTagSuggestions(e.target.value);
};

// styles
const styles = {
  container: {
    width: '80%',
    maxWidth: 1000,
  },
};

// compose
export default compose(
  withActions({getTagSuggestions}),
  withSelector('tags', tagSuggestionsSelector),

  withMemo('tagTitles', makeTagTitles, ['tags']),

  withCallback('onSearchTextChanged', onSearchTextChanged),

  withStyles(styles),
)(Search);
