import {Form, json, useActionData} from '@remix-run/react';
import type {ActionFunctionArgs, LoaderFunctionArgs} from '@remix-run/node';
import {Button} from '@www/components/ui/button';
import {requireUser} from '@www/services/security/requireUser';
import {useForm} from '@conform-to/react';
import {z} from 'zod';
import {TextInput} from '../../components/TextInput';
import {getZodConstraint, parseWithZod} from '@conform-to/zod';
import UrlSearch from './resources+/url-search';
import {useEffect, useState} from 'react';
import type {SearchData, SearchStatus} from './Types';
import Spinner from '@www/components/spinner';
import {match, P} from 'ts-pattern';
import type {CrawlResult} from 'crawl';
import type {Link} from 'domain/schwankie';
import {postLink} from '@www/services/domain/link.post';
import type {SubmissionResultSuccess} from '@www/types';
import {Toaster} from '@www/components/ui/toaster';
import {useToast} from '@www/components/ui/use-toast';

const schema = z.object({
  id: z.number().optional(),
  url: z.string().min(1, 'Url is required').url('A valid url is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().url('A valid url is required').optional().or(z.literal('')),
});

type SubmissionSuccessForForm = SubmissionResultSuccess<{data: z.infer<typeof schema>}>;

export async function loader({request}: LoaderFunctionArgs) {
  await requireUser(request, 'google-admin');

  return json({});
}

export async function action({request}: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {schema});

  if (submission.status !== 'success') {
    return json(submission.reply());
  }

  await postLink(submission.value);

  return json({
    status: 'success',
    result: {
      data: submission.value,
    },
  } as SubmissionSuccessForForm);
}

const isNumber = (x: unknown): x is number => typeof x === 'number';

export default function Index() {
  const lastResult = useActionData<typeof action>();

  const {data} = match(lastResult)
    .with({status: 'success'}, (data) => (data as SubmissionSuccessForForm).result)
    .otherwise(() => ({url: '', data: null}));

  const [form, fields] = useForm({
    defaultValue: data,
    lastResult,

    constraint: getZodConstraint(schema),

    onValidate({formData}) {
      return parseWithZod(formData, {schema});
    },

    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  const searchStatus = useState<SearchStatus>('idle');
  const searchData = useState<SearchData>(undefined);
  useEffect(() => {
    const searchValue = match(searchData[0])
      .with(undefined, () => undefined)
      .with({id: P.when(isNumber)}, (link: Link) => ({
        id: link.id,
        url: link.url,
        title: link.title,
        description: link.description,
        tags: link.tags ? (link.tags as string[]).join(', ') : undefined,
        imageUrl: link.imageUrl,
      }))
      .otherwise((crawl: CrawlResult) => ({
        id: null,
        url: crawl.url,
        title: crawl.title,
        description: crawl.description,
        tags: crawl.tags?.join(', '),
        imageUrl: crawl.imageUrl,
      }));

    if (!searchValue) {
      return;
    }

    form.update({name: 'id', value: searchValue.id || undefined});
    form.update({name: 'url', value: searchValue.url});
    form.update({name: 'title', value: searchValue.title});
    form.update({name: 'description', value: searchValue.description || undefined});
    form.update({name: 'tags', value: searchValue.tags});
    form.update({name: 'imageUrl', value: searchValue.imageUrl || undefined});
  }, [searchData[0]]);

  const {toast} = useToast();
  useEffect(() => {
    if (lastResult?.status !== 'success') {
      return;
    }

    toast({description: 'Link Saved', variant: 'success'});
  }, [lastResult, toast]);

  const disableForm = !form.valid;

  const LinkForm = (
    <Form
      method="post"
      id={form.id}
      onSubmit={form.onSubmit}
      noValidate
      className="flex flex-col justify-center w-full max-w-[600px] mx-auto"
    >
      <input type="hidden" name="id" />

      <TextInput label="Url" field={fields.url} />
      <TextInput label="Title" field={fields.title} />
      <TextInput label="Description" field={fields.description} />
      <TextInput label="Tags" field={fields.tags} />
      <TextInput label="Image" field={fields.imageUrl} />

      <Button type="submit" className="mt-5 mx-auto" disabled={disableForm}>
        Save
      </Button>
    </Form>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <UrlSearch searchContext={{status: searchStatus, data: searchData}} />

      <hr className="min-h-[1px] h-[1px] w-full max-w-[600px] mt-5 bg-primary" />

      {searchStatus[0] === 'idle' && LinkForm}
      {searchStatus[0] === 'loading' && <Spinner className="mt-3" />}

      <Toaster />
    </div>
  );
}
