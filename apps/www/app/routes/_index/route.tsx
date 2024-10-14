import ContentBlock from '@www/components/content-block';
import Page from '@www/components/page';
import type {MetaFunction} from '@remix-run/node';
import {description, title} from '@www/config.shared';

export const meta: MetaFunction = () => {
  return [{title: title()}, {name: 'description', content: description()}];
};

export default function Index() {
  return (
    <Page>
      <ContentBlock>Schwankie</ContentBlock>
    </Page>
  );
}
