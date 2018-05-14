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

const findLinkFromWeb = async url => {
  const response = await get('search', {url});
  const doc = $(response.data);
  const title = doc.filter('title').text();
  const description = doc.filter('meta[name="description"]').attr('content');
  const keywords = doc.filter('meta[name="keywords"]').attr('content');
  const images = doc
    .find('img')
    .toArray()
    .map(image => image.src)
    .filter(x => x && x.length > 0);

  return {
    url,
    title,
    description,
    tags: keywords ? keywords.join(', ') : '',
    images: images,
  };
};

const findLinkInStore = async url => {
  const response = await get(`links?url=${url}`);

  if (response.data.length > 0) {
    const link = response.data[0];
    return {
      ...link,
      tags: link.tags.join(', '),
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
