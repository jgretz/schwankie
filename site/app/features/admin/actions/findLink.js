import {get} from 'truefit-react-utils';
import $ from 'jquery';

export const LINK_FOUND = 'LINK_FOUND';
export const LINK_NOT_FOUND = 'LINK_NOT_FOUND';

const isUrlValid = userInput => {
  const res = userInput.match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_.~#?&//=]*)/g,
  );
  return res;
};

const origin = url => {
  const parts = url.split('/');
  return `${parts[0]}//${parts[2]}`;
};

const replaceMap = {
  'https://assets-cdn.github.com/images/spinners/octocat-spinner-32-EAF2F5.gif':
    'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png',
};

const mapImage = image => replaceMap[image] || image;

const findLinkFromWeb = async url => {
  try {
    const response = await get('search', {url});
    const doc = $(response.data);
    const title = doc.filter('title').text();
    const description = doc.filter('meta[name="description"]').attr('content');
    const keywords = doc.filter('meta[name="keywords"]').attr('content');

    let image = doc.filter('meta[name="og:image"]').attr('content');
    if (!image) {
      const images = doc
        .find('img')
        .toArray()
        .map(x => x.src.replace(location.origin, origin(url)));
      image = images.length > 0 ? images[0] : '';
    }

    return {
      id: null,
      url,
      title: title || '',
      description: description || '',
      tags: keywords && keywords.join ? keywords.join(', ') : '',
      image: mapImage(image),
    };
  } catch (err) {
    console.log(err); // eslint-disable-line
    return {
      id: null,
      url,
      title: '',
      description: '',
      tags: '',
      image: '',
    };
  }
};

const findLinkInStore = async url => {
  const response = await get(`links?url=${url}`);

  if (response.data.length > 0) {
    const link = response.data[0];
    return {
      ...link,
      tags: link.tags ? link.tags.join(', ') : '',
      image: mapImage(link.image),
    };
  }

  return null;
};

const createAction = link => ({
  type: LINK_FOUND,
  payload: link,
});

const notFoundAction = {
  type: LINK_NOT_FOUND,
};

export const findLink = async url => {
  if (!isUrlValid(url)) {
    return notFoundAction;
  }

  let link = await findLinkInStore(url);
  if (link) {
    return createAction(link);
  }

  link = await findLinkFromWeb(url);
  if (link) {
    return createAction(link);
  }

  return notFoundAction;
};
