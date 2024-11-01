import {useForm} from '@conform-to/react';
import {json, useFetcher} from '@remix-run/react';
import {Button} from '@www/components/ui/button';
import {z} from 'zod';
import {TextInput} from '../_components/TextInput';
import {getZodConstraint, parseWithZod} from '@conform-to/zod';
import type {ActionFunctionArgs} from '@remix-run/node';
import {searchByUrl} from '@www/services/search/searchForUrl';
import {match} from 'ts-pattern';
import type {SubmissionResultSuccess} from '@www/types';
import type {SearchContext} from '../Types';
import type {CrawlResult} from 'crawl';

const schema = z.object({
  url: z.string().min(1, 'Url is required').url('A valid url is required'),
});

interface Props {
  searchContext: SearchContext;
}

export async function action({request}: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {schema});
  if (submission.status !== 'success') {
    return json(submission.reply());
  }

  const {url} = submission.value;
  const data = await searchByUrl(url);

  return json({
    status: 'success',
    result: {
      url,
      data,
    },
  } as SubmissionResultSuccess);
}

export default function UrlSearch({searchContext: context}: Props) {
  const {
    status: [_searchStatus, setSearchStatus],
    data: [_searchData, setSearchData],
  } = context;

  const fetcher = useFetcher<typeof action>();

  const {url, data} = match(fetcher.data)
    .with({status: 'success'}, (data) => (data as SubmissionResultSuccess).result)
    .otherwise(() => ({url: '', data: null}));

  const [form, fields] = useForm({
    defaultValue: {
      url,
    },

    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',

    lastResult: fetcher.state === 'idle' ? fetcher.data : null,

    constraint: getZodConstraint(schema),

    onValidate({formData}) {
      return parseWithZod(formData, {schema});
    },

    onSubmit() {
      setSearchStatus('loading');
    },
  });

  if (fetcher.state === 'idle' && data) {
    setSearchStatus('idle');
    setSearchData(data as CrawlResult);
  }

  const disableSearch = fetcher.state === 'loading' || !form.valid;

  return (
    <div className="flex justify-center w-full">
      <fetcher.Form
        method="post"
        id={form.id}
        onSubmit={form.onSubmit}
        action="/admin/resources/url-search"
        noValidate
        className="flex flex-col justify-center w-full max-w-[600px]"
      >
        <TextInput label="Search For Url" field={fields.url} />

        <Button type="submit" className="mt-5 mx-auto" disabled={disableSearch}>
          Search
        </Button>
      </fetcher.Form>
    </div>
  );
}
