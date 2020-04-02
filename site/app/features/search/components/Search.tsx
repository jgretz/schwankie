/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {ChangeEvent} from 'react';

import {compose, withMemo, withCallback} from '@truefit/bach';
import {withActions, withSelector} from '@truefit/bach-redux';
import {withStyles} from '@truefit/bach-material-ui';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import {Tag} from '../../tag/types';
import {getTagSuggestions} from '../../tag/actions';
import {tagSuggestionsSelector} from '../../tag/selectors';

import {setSearchTerm} from '../actions';
import {searchTermSelector} from '../selectors';

import {scrollToTop} from '../../shared/services';

type Props = {
  classes: {
    container: string;
  };

  // tags
  tags: Tag[];
  tagTitles: string[];

  getTagSuggestions: (term: string) => void;
  onSearchTextChanged: (e: ChangeEvent<HTMLInputElement>, value: string, reason: string) => void;

  // search
  searchTerm: string;

  onSearchQueryChanged: (e: object, term: string) => void;
  setSearchTerm: (term: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeSearchField = (params: any) => (
  <TextField
    {...params}
    label="Search"
    margin="normal"
    variant="filled"
    InputProps={{...params.InputProps, type: 'search'}}
  />
);

const Search = ({
  classes,
  tagTitles,
  searchTerm,
  onSearchTextChanged,
  onSearchQueryChanged,
}: Props) => (
  <div className={classes.container}>
    <Autocomplete
      value={searchTerm}
      id="search-tags"
      freeSolo
      disableClearable
      options={tagTitles}
      renderInput={makeSearchField}
      onChange={onSearchQueryChanged}
      onInputChange={onSearchTextChanged}
    />
  </div>
);

// handlers

const makeTagTitles = ({tags}: Props) => tags.map((t) => t.title);

const onSearchTextChanged = ({getTagSuggestions, onSearchQueryChanged}: Props) => (
  e: ChangeEvent<HTMLInputElement>,
  value: string,
  reason: string,
) => {
  getTagSuggestions(value);

  if (reason === 'input' && value.length === 0) {
    onSearchQueryChanged(e, value);
  }
};

const onSearchQueryChanged = ({setSearchTerm}: Props) => (e: object, value: string) => {
  setSearchTerm(value);
  scrollToTop();
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
  withActions({getTagSuggestions, setSearchTerm}),

  withSelector('tags', tagSuggestionsSelector),
  withMemo('tagTitles', makeTagTitles, ['tags']),

  withSelector('searchTerm', searchTermSelector),
  withCallback('onSearchQueryChanged', onSearchQueryChanged),
  withCallback('onSearchTextChanged', onSearchTextChanged),

  withStyles(styles),
)(Search);
