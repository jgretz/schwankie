import {useForm, getFormProps} from '@conform-to/react';
import {useFetcher} from '@remix-run/react';
import {json, type ActionFunctionArgs} from '@remix-run/node';
import {setTheme} from '@www/utils/theme.server';

import {parseWithZod} from '@conform-to/zod';
import {invariantResponse} from '@epic-web/invariant';
import {z} from 'zod';
import {match} from 'ts-pattern';
import type {Theme} from '@www/types';
import {Sun, Moon} from 'lucide-react';

interface Props {
  userPreference?: Theme;
}

const ThemeFormSchema = z.object({
  theme: z.enum(['light', 'dark']),
});

export async function action({request}: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {schema: ThemeFormSchema});

  invariantResponse(submission.status === 'success', 'Invalid theme received');

  const {theme} = submission.value;

  const responseInit = {
    headers: {'set-cookie': setTheme(theme)},
  };
  return json({result: submission.reply()}, responseInit);
}

export default function ThemeSwitch({userPreference}: Props) {
  const fetcher = useFetcher<typeof action>();

  const [form] = useForm({
    id: 'theme-switch',
    lastResult: fetcher.data?.result,
  });

  const mode = userPreference ?? 'light';
  const nextMode = match(mode)
    .with('light', () => 'dark')
    .with('dark', () => 'light')
    .otherwise(() => 'light');

  const modeLabel = {
    light: <Sun />,
    dark: <Moon />,
  };

  return (
    <fetcher.Form method="POST" {...getFormProps(form)} action="/resources/theme-switch">
      <input type="hidden" name="theme" value={nextMode} />
      <div>
        <button type="submit" aria-label="switch site theme">
          {modeLabel[mode]}
        </button>
      </div>
    </fetcher.Form>
  );
}
