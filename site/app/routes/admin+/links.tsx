import type {ActionArgs} from '@remix-run/node';
import {TextInput} from './_components/text_input';
import {useForm} from '@conform-to/react';
import {parse} from '@conform-to/zod';
import {Form, useActionData} from '@remix-run/react';
import {json} from '@remix-run/node';
import {z} from 'zod';
import {saveLink} from '~/services/api/links/saveLinks';
import {Button} from '~/components/button';
import {Separator} from '~/components/separator';

const COMMANDS = {
  SaveLink: 'SaveLink',
  SearchLink: 'SearchLink',
};

const searchSchema = z.object({
  searchUrl: z.string().min(1, 'Url is required').url('Valid URL is required'),
});

const linkSchema = z.object({
  url: z.string().min(1, 'Url is required').url('Valid URL is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.string().min(1, 'At least 1 tag is required'),
  image: z.string().url('Valid URL is required').optional(),
});

export async function action({request}: ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('formName');

  switch (intent) {
    case COMMANDS.SearchLink: {
      const submission = parse(formData, {schema: searchSchema});
      if (!submission.value) {
        return json(submission, {status: 400});
      }

      return await saveLink(submission.value);
    }

    case COMMANDS.SaveLink: {
      const submission = parse(formData, {schema: linkSchema});
      if (!submission.value) {
        return json(submission, {status: 400});
      }

      return await saveLink(submission.value);
    }

    default: {
      return json({}, {status: 500});
    }
  }
}

export default function Links() {
  const lastSubmission = useActionData<typeof action>();

  const [searchForm, {searchUrl}] = useForm({
    lastSubmission,
    onValidate({formData}) {
      return parse(formData, {schema: searchSchema});
    },
  });

  const [linkForm, {url, title, description, tags, image}] = useForm({
    lastSubmission,
    onValidate({formData}) {
      return parse(formData, {schema: linkSchema});
    },
  });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-center w-full">
        <Form
          method="post"
          {...searchForm.props}
          className="flex flex-col justify-center w-full max-w-[600px]"
        >
          <TextInput label="Search For Url" {...searchUrl} />

          <Button name={COMMANDS.SearchLink} className="mt-5 mx-auto">
            Search
          </Button>
        </Form>
      </div>
      <Separator className="my-5 max-w-[600px]" />
      <div className="flex justify-center w-full">
        <Form
          method="post"
          {...linkForm.props}
          className="flex flex-col justify-center w-full max-w-[600px]"
        >
          <TextInput label="Url" {...url} />
          <TextInput label="Title" {...title} />
          <TextInput label="Description" {...description} />
          <TextInput label="Tags" {...tags} />
          <TextInput label="Image" {...image} />

          <Button name={COMMANDS.SaveLink} className="mt-5 mx-auto">
            Save
          </Button>
        </Form>
      </div>
    </div>
  );
}
