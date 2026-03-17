import {createContext, useCallback, useContext, useState, type ReactNode} from 'react';
import type {LinkData} from '@www/lib/api-client';

type ModalState =
  | {isOpen: false; mode: null; editLink: null}
  | {isOpen: true; mode: 'add'; editLink: null}
  | {isOpen: true; mode: 'edit'; editLink: LinkData};

type LinkModalContextValue = ModalState & {
  openAdd: () => void;
  openEdit: (link: LinkData) => void;
  close: () => void;
};

const LinkModalContext = createContext<LinkModalContextValue | null>(null);

const closedState: ModalState = {isOpen: false, mode: null, editLink: null};

export function LinkModalProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<ModalState>(closedState);

  const openAdd = useCallback(() => {
    setState({isOpen: true, mode: 'add', editLink: null});
  }, []);

  const openEdit = useCallback((link: LinkData) => {
    setState({isOpen: true, mode: 'edit', editLink: link});
  }, []);

  const close = useCallback(() => {
    setState(closedState);
  }, []);

  return (
    <LinkModalContext.Provider value={{...state, openAdd, openEdit, close}}>
      {children}
    </LinkModalContext.Provider>
  );
}

export function useLinkModal(): LinkModalContextValue {
  const ctx = useContext(LinkModalContext);
  if (!ctx) throw new Error('useLinkModal must be used within LinkModalProvider');
  return ctx;
}
