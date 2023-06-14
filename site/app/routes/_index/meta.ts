import type {V2_MetaFunction} from '@remix-run/node';

export const meta: V2_MetaFunction = () => {
  return [
    {title: 'Schwankie.com'},
    {name: 'description', content: 'Schwankie.com - an alternative memory'},
  ];
};
