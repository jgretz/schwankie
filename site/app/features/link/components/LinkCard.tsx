import React from 'react';

import {compose, withMemo} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import {format, fromUnixTime} from 'date-fns';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import {Theme, fade} from '@material-ui/core';
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
    dateContainer: string;
    date: string;
    content: string;
    title: string;
    description: string;
    tags: string;
  };

  date: string;
};

type Props = PublicProps & InternalProps;

const LinkCard = ({classes, link, date}: Props) => (
  <div className={classes.cardContainer}>
    <Card className={classes.card}>
      <div className={classes.dateContainer}>
        <div className={classes.date}>{date}</div>
      </div>
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

const makeDate = ({link}: Props) => format(fromUnixTime(link.date), 'LLL d, yyyy');

const styles = (theme: Theme) => ({
  cardContainer: {
    width: '33%',
    maxWidth: 430,

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

  dateContainer: {
    position: 'absolute',
  } as CSSProperties,
  date: {
    marginTop: 5,
    marginLeft: 5,

    padding: 5,
    borderRadius: 12,
    backgroundColor: fade(theme.palette.grey[900], 0.8),

    fontSize: 10,
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

export default compose<PublicProps>(
  withMemo('date', makeDate, ['link']),
  withStyles(styles),
)(LinkCard);
