import type {Link} from 'schwankie-domain';

interface Props {
  link: Link;
}

export function LinkItem({link}: Props) {
  return (
    <li>
      <h2>{link.title}</h2>
      <p>{link.url}</p>
    </li>
  );
}
