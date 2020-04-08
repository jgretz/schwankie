import React from 'react';
import {compose, withState, withCallback} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import {find} from 'lodash';
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

// constants
const DEFAULT_IMAGE = 'https://placeimg.com/300/300/any/grayscale';

// image overrides
const githubOverride = (link: Link) => link.url.includes('github.com');
const youtubeOverride = (link: Link) => link.url.includes('youtube.com');

const overrides = [
  {
    filter: githubOverride,
    url: 'https://github.githubassets.com/images/modules/logos_page/Octocat.png',
  },
  {
    filter: youtubeOverride,
    url:
      'https://lh3.googleusercontent.com/z6Sl4j9zQ88oUKNy0G3PAMiVwy8DzQLh_ygyvBXv0zVNUZ_wQPN_n7EAR2By3dhoUpX7kTpaHjRPni1MHwKpaBJbpNqdEsHZsH4q',
  },
];

// component
const Image = ({classes, link, src, handleError}: Props) => (
  <img className={classes.image} src={src} alt={link.title} onError={handleError} />
);

// handlers
const initialSrc = ({link}: Props) => {
  const override = find(overrides, (x) => x.filter(link));

  return override ? override.url : link.image;
};

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

// compose
export default compose<PublicProps>(
  withState('src', 'setSrc', initialSrc),
  withCallback('handleError', handleError),

  withStyles(styles),
)(Image);
