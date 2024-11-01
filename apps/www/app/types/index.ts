import type {SubmissionResult} from '@conform-to/react';
import {type ReactNode} from 'react';

export type HasChildrenProps = {
  children: ReactNode;
};

export type Theme = 'light' | 'dark';

export type SubmissionResultSuccess = SubmissionResult & {
  result: {
    url: string;
    data: unknown;
  };
};
