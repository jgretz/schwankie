import {createFileRoute, redirect} from '@tanstack/react-router';
import {z} from 'zod';
import {exchangeGmailCodeAction} from '../lib/gmail-actions';

const searchSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute('/auth/gmail-callback')({
  validateSearch: searchSchema,
  beforeLoad: async ({search}) => {
    if (search.error) {
      throw redirect({to: '/admin/gmail', search: {error: search.error}});
    }

    if (!search.code) {
      throw redirect({to: '/admin/gmail', search: {error: 'No authorization code received'}});
    }

    try {
      await exchangeGmailCodeAction({data: {code: search.code}});
    } catch (error) {
      console.error('Failed to exchange code:', error);
      throw redirect({to: '/admin/gmail', search: {error: 'Failed to connect Gmail'}});
    }
    throw redirect({to: '/admin/gmail'});
  },
  component: () => <div>Redirecting...</div>,
});
