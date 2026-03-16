import {useQueryClient} from '@tanstack/react-query';
import {useCallback, useEffect, useState} from 'react';
import {Button} from '@www/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@www/components/ui/dialog';
import {Input} from '@www/components/ui/input';
import {Textarea} from '@www/components/ui/textarea';
import {
  createLinkAction,
  deleteLinkAction,
  fetchMetadataAction,
  updateLinkAction,
} from '@www/lib/link-actions';
import {StatusToggle} from './status-toggle';
import {TagChipInput} from './tag-chip-input';

type EditLink = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  status: string;
  tags: Array<{id: number; text: string}>;
};

type LinkModalProps = {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  editLink?: EditLink;
};

type Stage = 'url-entry' | 'loading' | 'form';

export function LinkModal({mode, isOpen, onClose, editLink}: LinkModalProps) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<Stage>('url-entry');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'saved' | 'queued'>('saved');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && editLink) {
      setStage('form');
      setUrl(editLink.url);
      setTitle(editLink.title);
      setDescription(editLink.description ?? '');
      setTags(editLink.tags.map((t) => t.text));
      setStatus(editLink.status === 'queued' ? 'queued' : 'saved');
    } else {
      setStage('url-entry');
      setUrl('');
      setTitle('');
      setDescription('');
      setTags([]);
      setStatus('saved');
    }
    setDeleteConfirm(false);
    setSaving(false);
    setDeleting(false);
  }, [isOpen, mode, editLink]);

  const handleFetchMetadata = useCallback(async () => {
    if (!url.trim()) return;
    setStage('loading');
    try {
      const metadata = await fetchMetadataAction({data: {url: url.trim()}});
      setTitle(metadata.title ?? '');
      setDescription(metadata.description ?? '');
      setTags(metadata.tags ?? []);
      setStage('form');
    } catch {
      setStage('form');
    }
  }, [url]);

  const handleSave = useCallback(async () => {
    if (!url.trim() || !title.trim()) return;
    setSaving(true);
    try {
      if (mode === 'edit' && editLink) {
        await updateLinkAction({
          data: {
            id: editLink.id,
            url: url.trim(),
            title: title.trim(),
            description: description.trim() || undefined,
            status,
            tags,
          },
        });
      } else {
        await createLinkAction({
          data: {
            url: url.trim(),
            title: title.trim(),
            description: description.trim() || undefined,
            status,
            tags,
          },
        });
      }
      queryClient.invalidateQueries({queryKey: ['links']});
      queryClient.invalidateQueries({queryKey: ['tags']});
      onClose();
    } catch (error) {
      console.error('Failed to save link:', error);
      setSaving(false);
    }
  }, [url, title, description, status, tags, mode, editLink, queryClient, onClose]);

  const handleDelete = useCallback(async () => {
    if (!editLink) return;
    setDeleting(true);
    try {
      await deleteLinkAction({data: {id: editLink.id}});
      queryClient.invalidateQueries({queryKey: ['links']});
      queryClient.invalidateQueries({queryKey: ['tags']});
      onClose();
    } catch (error) {
      console.error('Failed to delete link:', error);
      setDeleting(false);
    }
  }, [editLink, queryClient, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[0.95rem] font-medium">
            {mode === 'edit' ? 'Edit link' : 'Add a link'}
          </DialogTitle>
        </DialogHeader>

        {stage === 'url-entry' && (
          <>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchMetadata()}
                className="flex-1"
                autoFocus
              />
              <button
                type="button"
                onClick={handleFetchMetadata}
                className="whitespace-nowrap rounded-md border border-border bg-bg-subtle px-[14px] py-2 font-sans text-[0.82rem] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
              >
                Fetch &rarr;
              </button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-border border-t-accent" />
            <span className="font-sans text-[0.82rem] text-text-faint">
              Fetching metadata&hellip;
            </span>
            <span className="max-w-full truncate px-4 font-sans text-[0.75rem] text-text-faint">
              {url}
            </span>
          </div>
        )}

        {stage === 'form' && (
          <>
            <div className="space-y-4">
              <StatusToggle value={status} onChange={setStatus} />

              <FormField label="URL">
                <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
              </FormField>

              <FormField label="Title">
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </FormField>

              <FormField label="Tags">
                <TagChipInput tags={tags} onChange={setTags} />
              </FormField>
            </div>

            <DialogFooter className="flex-row gap-2">
              {mode === 'edit' && (
                <div className="mr-auto">
                  {deleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[0.82rem] text-text-muted">
                        Are you sure?
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Confirm'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !url.trim() || !title.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormField({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div>
      <label className="mb-[0.35rem] block font-sans text-[0.72rem] font-medium uppercase tracking-[0.07em] text-text-faint">
        {label}
      </label>
      {children}
    </div>
  );
}
