import {createFileRoute, redirect} from '@tanstack/react-router';
import {z} from 'zod';
import {exchangeGmailCodeAction} from '../lib/gmail-actions';

const searchSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
});

type CallbackSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/auth/gmail-callback')({
  validateSearch: searchSchema,
  beforeLoad: async ({search}) => {
    const s = search as CallbackSearch;

    if (s.error) {
      throw redirect({to: '/admin/gmail', search: {error: s.error}});
    }

    if (!s.code) {
      throw redirect({to: '/admin/gmail', search: {error: 'No authorization code received'}});
    }

    try {
      await exchangeGmailCodeAction({data: {code: s.code}});
      throw redirect({to: '/admin/gmail'});
    } catch (error) {
      console.error('Failed to exchange code:', error);
      throw redirect({to: '/admin/gmail', search: {error: 'Failed to connect Gmail'}});
    }
  },
  component: () => <div>Redirecting...</div>,
});
