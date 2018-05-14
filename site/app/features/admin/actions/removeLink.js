import {httpDelete} from 'truefit-react-utils';

export const LINK_REMOVED = 'LINK_REMOVED';

export const removeLink = async link => {
  await httpDelete(`links?id=${link.id}`);

  return {
    type: LINK_REMOVED,
  };
};
