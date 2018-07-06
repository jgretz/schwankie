import React from 'react';
import {connect} from 'react-redux';

import {setSource} from '../../search/actions';
import {sourceSelector, termSelector} from '../../search/selectors';
import {SOURCE} from '../../shared/constants';

// actions
const handleSetSource = (source, {setSource}) => () => setSource(source);

// render
const emptyRender = () => null;

const render = ({source, ...props}) => (
  <div className="source">
    <div
      className={[
        'source-option',
        'left',
        source === SOURCE.Random ? 'active' : '',
      ].join(' ')}
      onClick={handleSetSource(SOURCE.Random, props)}
    >
      Random
    </div>

    <div
      className={[
        'source-option',
        'right',
        source === SOURCE.Recent ? 'active' : '',
      ].join(' ')}
      onClick={handleSetSource(SOURCE.Recent, props)}
    >
      Recent
    </div>
  </div>
);

const source = ({searchTerm, ...props}) => {
  if (searchTerm && searchTerm.length > 0) {
    return emptyRender();
  }

  return render(props);
};

// redux
const mapStateToProps = state => ({
  source: sourceSelector(state),
  searchTerm: termSelector(state),
});

export default connect(mapStateToProps, {setSource})(source);
