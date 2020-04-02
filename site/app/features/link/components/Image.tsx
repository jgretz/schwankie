import React from 'react';
import {compose, withState, withCallback} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import {Link} from '../types';

type PublicProps = {
  link: Link;
};

type InternalProps = {
  classes: {
    image: string;
  };

  src: string;
  setSrc: (src: string) => void;

  handleError: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
};

type Props = PublicProps & InternalProps;

const DEFAULT_IMAGE = 'https://placeimg.com/300/300/any/grayscale';

const Image = ({classes, link, src, handleError}: Props) => (
  <img className={classes.image} src={src} alt={link.title} onError={handleError} />
);

const initialSrc = ({link}: Props) => link.image;

const handleError = ({setSrc}: Props) => () => {
  setSrc(DEFAULT_IMAGE);
};

const styles = {
  image: {
    height: 200,
    width: '100%',
    borderBottom: '1px solid',
  },
};

export default compose<PublicProps>(
  withState('src', 'setSrc', initialSrc),
  withCallback('handleError', handleError),

  withStyles(styles),
)(Image);
