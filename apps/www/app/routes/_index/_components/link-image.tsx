import fillImage1 from '@www/assets/images/fill-1.png';
import fillImage2 from '@www/assets/images/fill-2.png';
import fillImage3 from '@www/assets/images/fill-3.png';
import {cn} from '@www/utils/cn';
import {Github, Twitter, Youtube} from 'lucide-react';
import {match} from 'ts-pattern';

interface Props {
  src?: string | undefined | null;
  className?: string | undefined;
  url: string;
}

const IMAGE_SIZE = 100;

const fillImages = [fillImage1, fillImage2, fillImage3];

function isGithubLink(url: string) {
  return url.includes('github.com');
}
function isYoutubleLink(url: string) {
  return url.includes('youtube.com');
}
function isTwitterLink(url: string) {
  return url.includes('twitter.com');
}

function staticImage({url, className}: Props) {
  return match(url)
    .when(
      (s) => isGithubLink(s),
      () => <Github size={IMAGE_SIZE} className={className} />,
    )
    .when(
      (s) => isYoutubleLink(s),
      () => <Youtube size={IMAGE_SIZE} className={className} />,
    )
    .when(
      (s) => isTwitterLink(s),
      () => <Twitter size={IMAGE_SIZE} className={className} />,
    )
    .otherwise(() => null);
}

function* fillImage() {
  let i = 0;
  while (true) {
    yield fillImages[i];
    i = (i + 1) % fillImages.length;
  }
}

export default function LinkImage({src, url, className}: Props) {
  const staticImg = staticImage({url, className});
  if (staticImg) {
    return staticImg;
  }

  const imageSrc = match(src)
    .when(
      (s) => !!s && s.length > 0,
      (s) => s,
    )
    .otherwise(() => {
      return fillImage().next().value;
    });

  return (
    <div
      style={{backgroundImage: `url('${imageSrc}')`, height: IMAGE_SIZE, width: IMAGE_SIZE}}
      className={cn(
        `min-h-[${IMAGE_SIZE}px] min-w-[${IMAGE_SIZE}px] h-[${IMAGE_SIZE}px] w-[${IMAGE_SIZE}px] bg-center bg-no-repeat bg-cover rounded-full mr-2 mb-2`,
        className,
      )}
    />
  );
}
