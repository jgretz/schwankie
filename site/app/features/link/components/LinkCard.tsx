import React from 'react';

import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import WorkerImage from 'react-sw-img';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {Theme} from '@material-ui/core';
import {CSSProperties} from '@material-ui/styles';

import {Link} from '../types';

type PublicProps = {
  link: Link;
};

type InternalProps = {
  classes: {
    cardContainer: string;
    card: string;
    image: string;
    link: string;
    button: string;
    title: string;
    description: string;
    subtitle: string;
  };
};

type Props = PublicProps & InternalProps;

const DEFAULT_IMAGE = 'https://placeimg.com/300/300/any/grayscale';

const LinkCard = ({classes, link}: Props) => (
  <div className={classes.cardContainer}>
    <Card className={classes.card}>
      <WorkerImage className={classes.image} src={link.image} placeholder={DEFAULT_IMAGE} />
      <CardContent>
        <a className={classes.link} href={link.url} target="_blank">
          <Button className={classes.button} variant="contained" color="primary">
            Visit
          </Button>
        </a>
        <Typography className={classes.title}>{link.title}</Typography>
        <Typography className={classes.description} variant="subtitle2">
          {link.description}
        </Typography>
        <Typography className={classes.subtitle} variant="subtitle2">
          {link.tags.join(', ')}
        </Typography>
      </CardContent>
    </Card>
  </div>
);

const styles = (theme: Theme) => ({
  cardContainer: {
    width: '33%',

    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  card: {
    margin: 20,
    minHeight: 330,
  },
  image: {
    height: 200,
    width: '100%',
    borderBottom: '1px solid',
  },

  link: {
    textDecoration: 'none',
  },
  button: {
    float: 'right',
    top: -40,
  } as CSSProperties,
  title: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    marginBottom: 3,
  } as CSSProperties,
  description: {
    marginBottom: 3,

    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSProperties,
  subtitle: {
    color: theme.palette.primary.main,

    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSProperties,
});

export default compose<PublicProps>(withStyles(styles))(LinkCard);
