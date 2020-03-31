import React from 'react';
import {compose, withState, withCallback} from '@truefit/bach';
import {withStyles} from '@truefit/bach-material-ui';

import InfoIcon from '@material-ui/icons/Info';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import {Theme} from '@material-ui/core';
import {CSSProperties} from '@material-ui/styles';

type Classes = {
  icon: string;
  titleRoot: string;
  titleCloseButton: string;
};

type AboutIconProps = {
  classes: Classes;
  onClick: () => void;
};

type AboutTitleProps = {
  classes: Classes;
  onClose: () => void;
};

type AboutProps = {
  classes: Classes;

  modalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  handleOpenModal: () => void;
  handleCloseModal: () => void;
};

const AboutContent = () => (
  <DialogContent dividers>
    <Typography gutterBottom>
      TLDR: It&#39;s a fancy replacement for my browser bookmarks
      <br />
      <br />
      I read a lot. Whether from Twitter, newsletters, HackerNews, or conferences - a large
      percentage of my life is spent drinking from the information firehose that is the internet. A
      lot of what I find, I categorize and store for the future. That said, I&#39;ve been doing this
      for years, and much of what I&#39;ve indexed lies unfindable in my Chrome bookmarks. This is
      the problem this site is intended to fix.
      <br />
      <br />
      In addition to providing a public, searchable index of my bookmarks, I also wanted to build a
      better way of categorizing them. With the nature of bookmarks, the only real categorizing you
      can do is with a lot of nested folder. Rather than follow that paradigm, this site allows me
      to tag each link as well, adding a layer of knowledge and discoverability that I have been
      missing.
      <br />
      <br />
      My bookmarks tend towards either tech or cooking, so if you are looking for something in those
      domains, chances are you might find something interesting or helpful here.
    </Typography>
  </DialogContent>
);

const AboutTitle = ({classes, onClose}: AboutTitleProps) => (
  <DialogTitle className={classes.titleRoot} disableTypography>
    <Typography variant="h6">Schwankie.com</Typography>
    <Typography variant="subtitle1">A random index of the web</Typography>
    <IconButton className={classes.titleCloseButton} aria-label="close" onClick={onClose}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>
);

const AboutIcon = ({classes, onClick}: AboutIconProps) => (
  <InfoIcon className={classes.icon} onClick={onClick} />
);

const About = ({classes, modalOpen, handleOpenModal, handleCloseModal}: AboutProps) => (
  <>
    <AboutIcon classes={classes} onClick={handleOpenModal} />
    <Dialog
      open={modalOpen}
      onClose={handleCloseModal}
      aria-labelledBy="About"
      arial-describedby="About"
    >
      <DialogContent>
        <AboutTitle classes={classes} onClose={handleCloseModal} />
        <AboutContent />
      </DialogContent>
    </Dialog>
  </>
);

const handleOpenModal = ({setModalOpen}: AboutProps) => () => {
  setModalOpen(true);
};

const handleCloseModal = ({setModalOpen}: AboutProps) => () => {
  setModalOpen(false);
};

const styles = (theme: Theme) => ({
  icon: {
    color: theme.palette.primary.main,
  },

  titleRoot: {
    margin: 0,
    padding: theme.spacing(2),
  },
  titleCloseButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  } as CSSProperties,
});

export default compose(
  withState('modalOpen', 'setModalOpen', false),
  withCallback('handleOpenModal', handleOpenModal),
  withCallback('handleCloseModal', handleCloseModal),
  withStyles(styles),
)(About);
