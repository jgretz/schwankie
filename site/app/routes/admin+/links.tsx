import type {ActionArgs} from '@remix-run/node';
import {TextInput} from './_components/text_input';
import {conform, useForm} from '@conform-to/react';
import {parse} from '@conform-to/zod';
import {Form, useActionData} from '@remix-run/react';
import {z} from 'zod';
import {saveLink} from '~/services/api/links/saveLinks';
import {Button} from '~/components/ui/button';
import {Separator} from '~/components/ui/separator';
import {crawlLink} from '~/services/api/links/crawlLink';
import type {LinkSearchResponseItem, SaveLink} from '~/Types';
import {Spinner} from '~/components/ui/spinner';
import {useIsSubmitting} from '~/hooks/useIsSubmitting';

const COMMANDS = {
  SaveLink: 'SaveLink',
  CrawlLink: 'CrawlLink',
};

const crawlSchema = z.object({
  url: z.string().min(1, 'Url is required').url('Valid URL is required'),
});

const linkSchema = z.object({
  url: z.string().min(1, 'Url is required').url('Valid URL is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.string().min(1, 'At least 1 tag is required'),
  image_url: z.string().url('Valid URL is required').optional(),
});

export async function action({request}: ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get(conform.INTENT) || '';

  const schema = intent === COMMANDS.CrawlLink ? crawlSchema : linkSchema;
  const submission = parse(formData, {schema});

  if (!submission.value) {
    return {intent, payload: {}, error: {}};
  }

  let response;
  switch (intent) {
    case COMMANDS.CrawlLink:
      response = await crawlLink(submission.value);
      break;

    case COMMANDS.SaveLink:
      response = await saveLink(submission.value as SaveLink);
      break;

    default:
      return {intent, payload: {}, error: {}};
  }

  const payload = (await response.json()) as LinkSearchResponseItem;
  const tags = payload.link_tag.map((i) => i.tag.text).join(', ');

  return {
    intent,
    payload: {
      ...payload,
      tags,
    },
    error: {},
  };
}

function CrawlForm() {
  const lastSubmission = useActionData<typeof action>();
  const [form, {url}] = useForm({
    lastSubmission,
    onValidate({formData}) {
      return parse(formData, {schema: crawlSchema});
    },
  });

  return (
    <div className="flex justify-center w-full">
      <Form
        method="post"
        {...form.props}
        className="flex flex-col justify-center w-full max-w-[600px]"
      >
        <TextInput label="Search For Url" {...url} />

        <Button
          type="submit"
          name={conform.INTENT}
          value={COMMANDS.CrawlLink}
          className="mt-5 mx-auto"
        >
          Search
        </Button>
      </Form>
    </div>
  );
}

function LinkForm() {
  const lastSubmission = useActionData<typeof action>();
  const [form, {url, title, description, tags, image_url}] = useForm({
    lastSubmission,
    onValidate({formData}) {
      return parse(formData, {schema: linkSchema});
    },
  });

  return (
    <div className="flex justify-center w-full">
      <Form
        method="post"
        {...form.props}
        className="flex flex-col justify-center w-full max-w-[600px]"
      >
        <TextInput label="Url" {...url} />
        <TextInput label="Title" {...title} />
        <TextInput label="Description" {...description} />
        <TextInput label="Tags" {...tags} />
        <TextInput label="Image" {...image_url} />

        <Button
          type="submit"
          name={conform.INTENT}
          value={COMMANDS.SaveLink}
          className="mt-5 mx-auto"
        >
          Save
        </Button>
      </Form>
    </div>
  );
}

// TODO: Add Spinner when searching / saving
// TODO: Add Toast

export default function Links() {
  const isSubmitting = useIsSubmitting();
  console.log(isSubmitting ? 'YAY' : 'NO');
  if (isSubmitting) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col items-center w-full">
      <CrawlForm />
      <Separator className="my-5 max-w-[600px]" />
      <LinkForm />
    </div>
  );
}
