import {createContext, useContext} from 'react';
import type {LinkData} from '@www/lib/api-client';

type LinkModalContextValue = {
  openEdit: (link: LinkData) => void;
};

const LinkModalContext = createContext<LinkModalContextValue>({
  openEdit: () => {},
});

export const LinkModalProvider = LinkModalContext.Provider;

export function useLinkModal() {
  return useContext(LinkModalContext);
}
