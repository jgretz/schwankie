import type {V2_MetaFunction} from '@remix-run/node';
import {Navbar} from '../../components/navbar/navbar';
import {LinkList} from '../resources/link_list/route';

export const meta: V2_MetaFunction = () => {
  return [
    {title: 'Schwankie.com'},
    {name: 'description', content: 'Schwankie.com - an alternative memory'},
  ];
};

export default function Index() {
  return (
    <div className="pb-5">
      <Navbar />
      <LinkList />
    </div>
  );
}
