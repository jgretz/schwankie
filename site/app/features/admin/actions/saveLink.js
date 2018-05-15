import _ from 'lodash';
import moment from 'moment';
import {post, put} from 'truefit-react-utils';

export const LINK_SAVED = 'LINK_SAVED';

export const saveLink = async item => {
  const inbound = item.toJS();
  const body = {
    ...inbound,

    id: inbound.id ? inbound.id : undefined, // eslint-disable-line
    tags: inbound.tags
      .split(',')
      .map(t => _.trim(t).toLowerCase())
      .filter(x => x.length > 0),
    date: moment().unix(),
  };

  const response = await (item.id ? put('links', body) : post('links', body));
  const link = response.data;

  return {
    type: LINK_SAVED,
    payload: {
      ...link,
      tags: link.tags.join(', '),
    },
  };
};
