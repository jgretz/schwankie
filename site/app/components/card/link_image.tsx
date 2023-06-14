import {useMemo} from 'react';
import type {LinkSearchResponseItem} from '~/Types';

import noImage1 from '../../images/no-image-1.png';
import noImage2 from '../../images/no-image-2.png';
import noImage3 from '../../images/no-image-3.png';
import noImage4 from '../../images/no-image-4.png';

interface Props {
  link: LinkSearchResponseItem;
}

const noImages = [noImage1, noImage2, noImage3, noImage4];

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

const handleUnknownImage = () => {
  const index = Math.floor(Math.random() * noImages.length);
  return noImages[index];
};

export function LinkImage({link}: Props) {
  const {url, image_url} = link;

  const imageSrc = useMemo(() => {
    return image_url ? handleKnownImage(url, image_url) : handleUnknownImage();
  }, [image_url, url]);

  const imageAlt = useMemo(() => link.description || link.title, [link.description, link.title]);

  return <img className="h-[100px] w-[100px] ml-5 my-5 rounded-md" src={imageSrc} alt={imageAlt} />;
}
