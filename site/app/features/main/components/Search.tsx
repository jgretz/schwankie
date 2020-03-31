import React, {ChangeEvent} from 'react';

import {compose, withMemo, withCallback} from '@truefit/bach';
import {withActions, withSelector} from '@truefit/bach-redux';
import {withStyles} from '@truefit/bach-material-ui';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import {Tag} from '../../tag/types';
import {getTagSuggestions} from '../../tag/actions';
import {tagSuggestionsSelector} from '../../tag/selectors';

import {loadLinksForSearch} from '../../link/actions';

type Props = {
  classes: {
    container: string;
  };

  tags: Tag[];
  tagTitles: string[];

  getTagSuggestions: (term: string) => void;
  onSearchTextChanged: (e: ChangeEvent<HTMLInputElement>) => void;

  loadLinksForSearch: (query: string) => void;
  onSearchTermChanged: (e: object, term: string) => void;
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

const Search = ({classes, tagTitles, onSearchTextChanged, onSearchTermChanged}: Props) => (
  <div className={classes.container}>
    <Autocomplete
      id="search-tags"
      freeSolo
      disableClearable
      options={tagTitles}
      renderInput={makeSearchField(onSearchTextChanged)}
      onChange={onSearchTermChanged}
    />
  </div>
);

// handlers
const makeTagTitles = ({tags}: Props) => tags.map((t) => t.title);

const onSearchTextChanged = ({getTagSuggestions}: Props) => (e: ChangeEvent<HTMLInputElement>) => {
  getTagSuggestions(e.target.value);
};

const onSearchTermChanged = ({loadLinksForSearch}: Props) => (e: object, value: string) => {
  loadLinksForSearch(value);
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
  withActions({getTagSuggestions, loadLinksForSearch}),
  withSelector('tags', tagSuggestionsSelector),

  withMemo('tagTitles', makeTagTitles, ['tags']),

  withCallback('onSearchTextChanged', onSearchTextChanged),
  withCallback('onSearchTermChanged', onSearchTermChanged),

  withStyles(styles),
)(Search);
