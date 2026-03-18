import {useQueryClient} from '@tanstack/react-query';
import {useCallback, useEffect, useState} from 'react';
import {toast} from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@www/components/ui/dialog';
import {
  createLinkAction,
  deleteLinkAction,
  fetchMetadataAction,
  refetchLinkAction,
  suggestTagsAction,
  updateLinkAction,
} from '@www/lib/link-actions';
import {useLinkModal} from './link-modal-context';
import {StatusToggle} from './status-toggle';
import {TagChipInput} from './tag-chip-input';
import {useFormValidation} from './use-form-validation';

type Stage = 'url-entry' | 'loading' | 'form';

type FormData = {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  status: 'saved' | 'queued';
  tags: string[];
};

const URL_REGEX = /^https?:\/\/.+/;

const emptyForm: FormData = {
  url: '',
  title: '',
  description: '',
  imageUrl: '',
  status: 'saved',
  tags: [],
};

const formValidationSchema = {
  url: {
    required: true,
    rules: [
      {
        validate: (v: string) => URL_REGEX.test(v),
        message: 'Must be a valid URL (http:// or https://)',
      },
      {
        validate: (v: string) => v.length <= 2000,
        message: 'Must be under 2000 characters',
      },
    ],
  },
  title: {
    required: true,
    rules: [
      {
        validate: (v: string) => v.length <= 200,
        message: 'Must be under 200 characters',
      },
    ],
  },
  description: {
    rules: [
      {
        validate: (v: string) => v.length <= 1000,
        message: 'Must be under 1000 characters',
      },
    ],
  },
  imageUrl: {
    rules: [
      {
        validate: (v: string) => {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Must be a valid URL (http:// or https://)',
      },
      {
        validate: (v: string) => v.length <= 2000,
        message: 'Must be under 2000 characters',
      },
    ],
  },
};

export function LinkModal() {
  const {isOpen, mode, editLink, close} = useLinkModal();
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<Stage>('url-entry');
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const {errors, validate, touch, touched, reset} = useFormValidation(formValidationSchema, form);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStage('url-entry');
      setForm(emptyForm);
      setSaving(false);
      setSuggestingTags(false);
      setRefetching(false);
      setConfirmDelete(false);
      setError('');
      reset();
      return;
    }

    if (mode === 'edit' && editLink) {
      setStage('form');
      setForm({
        url: editLink.url,
        title: editLink.title,
        description: editLink.description ?? '',
        imageUrl: editLink.imageUrl ?? '',
        status: editLink.status === 'queued' ? 'queued' : 'saved',
        tags: editLink.tags.map((t) => t.text),
      });
    } else {
      setStage('url-entry');
      setForm(emptyForm);
    }
  }, [isOpen, mode, editLink]);

  const handleFetchMetadata = useCallback(async (url: string) => {
    setStage('loading');
    setError('');
    try {
      const meta = await fetchMetadataAction({data: {url}});
      setForm((prev) => ({
        ...prev,
        url,
        title: meta.title || '',
        description: meta.description ?? '',
        imageUrl: meta.imageUrl ?? '',
      }));
    } catch (err) {
      console.warn('Failed to fetch metadata:', err);
      toast.error('Failed to fetch metadata');
      setForm((prev) => ({...prev, url}));
    }
    setStage('form');
  }, []);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (mode === 'edit' && editLink) {
        await updateLinkAction({
          data: {
            id: editLink.id,
            url: form.url,
            title: form.title,
            description: form.description || undefined,
            imageUrl: form.imageUrl || undefined,
            status: form.status,
            tags: form.tags,
          },
        });
      } else {
        await createLinkAction({
          data: {
            url: form.url,
            title: form.title,
            description: form.description || undefined,
            imageUrl: form.imageUrl || undefined,
            status: form.status,
            tags: form.tags,
          },
        });
      }
      queryClient.invalidateQueries({queryKey: ['links']});
      queryClient.invalidateQueries({queryKey: ['tags']});
      close();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save link';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [mode, editLink, form, queryClient, close, validate]);

  const handleSuggestTags = useCallback(async () => {
    if (!editLink) return;
    setSuggestingTags(true);
    try {
      const {tags: suggested} = await suggestTagsAction({data: {id: editLink.id}});
      if (suggested.length === 0) {
        toast('No tag suggestions available');
        return;
      }
      setForm((prev) => {
        const merged = [...prev.tags];
        for (const tag of suggested) {
          const normalized = tag.trim().toLowerCase();
          if (normalized && !merged.includes(normalized)) {
            merged.push(normalized);
          }
        }
        return {...prev, tags: merged};
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suggest tags';
      toast.error(message);
    } finally {
      setSuggestingTags(false);
    }
  }, [editLink]);

  const handleRefetch = useCallback(async () => {
    if (!editLink) return;
    setRefetching(true);
    try {
      const updated = await refetchLinkAction({data: {id: editLink.id}});
      setForm((prev) => ({
        ...prev,
        title: updated.title,
        description: updated.description ?? '',
        imageUrl: updated.imageUrl ?? '',
      }));
      toast.success('Link re-fetched');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to re-fetch link';
      toast.error(message);
    } finally {
      setRefetching(false);
    }
  }, [editLink]);

  const handleDelete = useCallback(async () => {
    if (!editLink) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await deleteLinkAction({data: {id: editLink.id}});
      queryClient.invalidateQueries({queryKey: ['links']});
      queryClient.invalidateQueries({queryKey: ['tags']});
      close();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete link';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [editLink, confirmDelete, queryClient, close]);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({...prev, [key]: value}));
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Link' : 'Add Link'}</DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'edit' ? 'Edit an existing link' : 'Add a new link to your collection'}
          </DialogDescription>
        </DialogHeader>

        {stage === 'url-entry' && <UrlEntryStage onSubmit={handleFetchMetadata} />}

        {stage === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
            <span className="ml-3 font-sans text-[0.85rem] text-text-muted">
              Fetching metadata…
            </span>
          </div>
        )}

        {stage === 'form' && (
          <div className="space-y-4">
            <Field label="URL" required error={touched.url ? errors.url : undefined}>
              <input
                type="url"
                value={form.url}
                onChange={(e) => updateField('url', e.target.value)}
                onBlur={() => touch('url')}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors focus:border-accent"
              />
            </Field>

            {mode === 'edit' && editLink?.status === 'queued' && (
              <button
                type="button"
                onClick={handleRefetch}
                disabled={refetching || saving}
                className="flex items-center gap-1.5 font-sans text-[0.75rem] text-text-muted transition-colors hover:text-accent disabled:opacity-50"
              >
                {refetching ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-text-muted border-t-accent" />
                    Re-fetching…
                  </>
                ) : (
                  'Re-fetch metadata'
                )}
              </button>
            )}

            <Field label="Title" required error={touched.title ? errors.title : undefined}>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                onBlur={() => touch('title')}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors focus:border-accent"
              />
            </Field>

            <Field label="Description" error={touched.description ? errors.description : undefined}>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                onBlur={() => touch('description')}
                rows={2}
                className="w-full resize-none rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors focus:border-accent"
              />
            </Field>

            <Field label="Image URL" error={touched.imageUrl ? errors.imageUrl : undefined}>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                onBlur={() => touch('imageUrl')}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors focus:border-accent"
              />
            </Field>

            <Field label="Tags">
              <TagChipInput tags={form.tags} onChange={(tags) => updateField('tags', tags)} />
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  disabled={suggestingTags || saving}
                  className="mt-1.5 flex items-center gap-1.5 font-sans text-[0.75rem] text-text-muted transition-colors hover:text-accent disabled:opacity-50"
                >
                  {suggestingTags ? (
                    <>
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-text-muted border-t-accent" />
                      Suggesting…
                    </>
                  ) : (
                    'Suggest tags'
                  )}
                </button>
              )}
            </Field>

            <Field label="Status">
              <StatusToggle value={form.status} onChange={(v) => updateField('status', v)} />
            </Field>

            {error && <p className="font-sans text-[0.8rem] text-red-600">{error}</p>}

            <DialogFooter className="flex items-center gap-2 pt-2">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="mr-auto font-sans text-[0.8rem] text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
                >
                  {confirmDelete ? 'Confirm delete?' : 'Delete'}
                </button>
              )}
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-border px-4 py-1.5 font-sans text-[0.8rem] text-text-muted transition-colors hover:bg-bg-subtle"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-accent px-4 py-1.5 font-sans text-[0.8rem] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : mode === 'edit' ? 'Update' : 'Save'}
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function UrlEntryStage({onSubmit}: {onSubmit: (url: string) => void}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setError('Required');
      return;
    }

    if (!URL_REGEX.test(trimmed)) {
      setError('Must be a valid URL (http:// or https://)');
      return;
    }

    setError('');
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="URL" required error={error || undefined}>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
          }}
          onBlur={() => {
            const trimmed = url.trim();
            if (trimmed && !/^https?:\/\/.+/.test(trimmed)) {
              setError('Must be a valid URL (http:// or https://)');
            }
          }}
          placeholder="https://…"
          autoFocus
          className="w-full rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent"
        />
      </Field>
      <DialogFooter>
        <button
          type="submit"
          disabled={!url.trim()}
          className="rounded-md bg-accent px-4 py-1.5 font-sans text-[0.8rem] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          Fetch
        </button>
      </DialogFooter>
    </form>
  );
}

function Field({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-sans text-[0.8rem] font-medium text-text-muted">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
      {error && <p className="font-sans text-[0.75rem] text-destructive">{error}</p>}
    </label>
  );
}
