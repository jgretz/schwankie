import React from 'react';

import {compose} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import {Theme} from '@material-ui/core';
import {CSSProperties} from '@material-ui/styles';
import Tag from './Tag';
import Image from './Image';
import Buttons from './Buttons';

import {Link} from '../types';

type PublicProps = {
  link: Link;
};

type InternalProps = {
  classes: {
    cardContainer: string;
    card: string;
    content: string;
    title: string;
    description: string;
    tags: string;
  };
};

type Props = PublicProps & InternalProps;

const LinkCard = ({classes, link}: Props) => (
  <div className={classes.cardContainer}>
    <Card className={classes.card}>
      <Image link={link} />
      <CardContent className={classes.content}>
        <Buttons link={link} />
        <Typography className={classes.title}>{link.title}</Typography>
        <Typography className={classes.description} variant="subtitle2">
          {link.description}
        </Typography>
        <div className={classes.tags}>
          {link.tags.map((tag, index) => (
            <Tag key={tag} tag={tag} comma={index < link.tags.length - 1} />
          ))}
        </div>
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
    display: 'flex',
    flexDirection: 'column',

    margin: 20,
    minHeight: 330,
  } as CSSProperties,

  content: {
    flex: 1,

    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',

    height: '100%',
    paddingTop: '13px !important',
    paddingBottom: '10px !important',
  } as CSSProperties,
  title: {
    fontSize: '1.2em',
    fontWeight: 'bold',
  } as CSSProperties,
  description: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSProperties,
  tags: {
    display: 'flex',
    flexDirection: 'row',

    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSProperties,
});

export default compose<PublicProps>(withStyles(styles))(LinkCard);
