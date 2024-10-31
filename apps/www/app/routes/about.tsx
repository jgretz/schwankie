import ContentBlock from '@www/components/content-block';
import Page from '@www/components/page';

export default function About() {
  return (
    <Page>
      <ContentBlock>
        Schwankie.com is a repository of random sites I've found interesting or applicable over the
        years. I used to keep a ridiculously long list of bookmarks, but categorizing everything in
        a heirarchy structure was never a clean or effective as I wanted - so as any engineer would
        do - I built my own solution.
      </ContentBlock>
      <ContentBlock>
        As you can tell on first glance, the majority of my links fall into one of the following
        categories: recipes, running, or tech. I hope you find something useful or at least unusual
        here ...
      </ContentBlock>
      <ContentBlock>
        If you want to know more about me personally or to connect, feel free to head over to{' '}
        <a href="https://joshgretz.com" target="_blank">
          joshgretz.com
        </a>
        .
      </ContentBlock>
    </Page>
  );
}
