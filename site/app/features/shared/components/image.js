import React, {Component} from 'react';
import {loadImage} from '../services';

const DEFAULT_IMAGE = 'https://placeimg.com/300/300/any/grayscale';

export default class ImageWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displaySrc: DEFAULT_IMAGE,
    };
  }

  componentDidMount() {
    const {src, onLoad} = this.props;
    if (!src || src.length === 0) {
      return;
    }

    loadImage(src, () => {
      if (this.unmounted) {
        return;
      }

      this.setState({displaySrc: src});

      if (onLoad) {
        setImmediate(() => {
          onLoad();
        });
      }
    });
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    return <img src={this.state.displaySrc} />;
  }
}
