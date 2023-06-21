import {useMemo} from 'react';
import type {LinkSearchResponseItem} from '~/Types';
import {API_URL} from '~/constants';

interface Props {
  link: LinkSearchResponseItem;
}

const RANDOM = `${API_URL}/images/random`;
const GITHUB = 'https://github.githubassets.com/images/modules/logos_page/Octocat.png';
const YOUTUBE =
  'https://lh3.googleusercontent.com/z6Sl4j9zQ88oUKNy0G3PAMiVwy8DzQLh_ygyvBXv0zVNUZ_wQPN_n7EAR2By3dhoUpX7kTpaHjRPni1MHwKpaBJbpNqdEsHZsH4q';

const isGithubLink = (url: string) => url.includes('github.com');
const isYoutubleLink = (url: string) => url.includes('youtube.com');

const handleKnownImage = (url: string, image_url: string) => {
  if (isGithubLink(url)) {
    return GITHUB;
  }

  if (isYoutubleLink(url)) {
    return YOUTUBE;
  }

  return image_url;
};

const handleUnknownImage = (id: number) => {
  return `${RANDOM}?id=${id}`;
};

export function LinkImage({link}: Props) {
  const {id, url, image_url} = link;

  const imageSrc = useMemo(() => {
    return image_url ? handleKnownImage(url, image_url) : handleUnknownImage(id);
  }, [id, image_url, url]);

  const imageAlt = useMemo(() => link.description || link.title, [link.description, link.title]);

  return (
    <img
      className="h-[100px] w-[100px] ml-5 my-5 rounded-md border"
      src={imageSrc}
      alt={imageAlt}
    />
  );
}
