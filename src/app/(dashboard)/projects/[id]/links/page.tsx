'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2, Link2, Plus, Pencil, Trash2, ExternalLink,
  Globe, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ── Service name inference ────────────────────────────────────────────────────

function inferServiceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('github'))         return 'GitHub';
    if (host.includes('jira') || host.includes('atlassian')) return 'Jira';
    if (host.includes('bitbucket'))      return 'Bitbucket';
    if (host.includes('figma'))          return 'Figma';
    if (host.includes('drive.google'))   return 'Google Drive';
    if (host.includes('notion'))         return 'Notion';
    if (host.includes('linear'))         return 'Linear';
    if (host.includes('trello'))         return 'Trello';
    if (host.includes('slack'))          return 'Slack';
    if (host.includes('confluence'))     return 'Confluence';
    if (host.includes('gitlab'))         return 'GitLab';
    if (host.includes('asana'))          return 'Asana';
    if (host.includes('clickup'))        return 'ClickUp';
    const parts = host.split('.');
    const root = parts[0] ?? '';
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return '';
  }
}

function getHostname(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

// ── Service icon via Google favicon CDN ───────────────────────────────────────

function ServiceIcon({ url, name, size = 20 }: { url: string; name: string; size?: number }) {
  const hostname = getHostname(url);
  const cls = size === 20 ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
      alt={name}
      className={`${cls} object-contain rounded-sm`}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectLink {
  id: string;
  name: string;
  url: string;
  description: string | null;
  position: number;
  createdAt: string;
}

// ── Add / Edit Dialog ─────────────────────────────────────────────────────────

interface LinkFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; url: string; description: string }) => Promise<void>;
  initial?: Partial<ProjectLink>;
}

function LinkFormDialog({ open, onClose, onSave, initial }: LinkFormDialogProps) {
  const [name, setName]           = React.useState('');
  const [url, setUrl]             = React.useState('');
  const [description, setDesc]    = React.useState('');
  const [urlError, setUrlError]   = React.useState('');
  const [saving, setSaving]       = React.useState(false);

  // Sync state when dialog opens or initial changes
  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setUrl(initial?.url ?? '');
      setDesc(initial?.description ?? '');
      setUrlError('');
    }
  }, [open, initial]);

  // Auto-infer name from URL when name is blank
  const handleUrlBlur = (val: string) => {
    validateUrl(val);
    if (!name.trim() && val) {
      const inferred = inferServiceName(val);
      if (inferred) setName(inferred);
    }
  };

  const validateUrl = (val: string): boolean => {
    try { new URL(val); setUrlError(''); return true; }
    catch { setUrlError('Please enter a valid URL (e.g. https://github.com/...)'); return false; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) return;
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), url: url.trim(), description: description.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            {initial?.id ? 'Edit Link' : 'Add Project Link'}
          </DialogTitle>
          <DialogDescription>
            Save an external URL for quick access from this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">URL *</label>
            <div className="flex items-center gap-0">
              {url && (
                <div className="flex items-center px-3 h-10 border border-r-0 border-slate-200 rounded-l-md bg-slate-50 shrink-0">
                  <ServiceIcon url={url} name={name} size={16} />
                </div>
              )}
              <Input
                type="url"
                placeholder="https://github.com/org/repo"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setUrl(e.target.value);
                  if (urlError) validateUrl(e.target.value);
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleUrlBlur(e.target.value)}
                className={`flex-1 ${url ? 'rounded-l-none' : ''} ${urlError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                required
              />
            </div>
            {urlError && <p className="text-xs text-red-500">{urlError}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Link Name *</label>
            <Input
              placeholder="GitHub, Jira, Figma..."
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input
              placeholder="e.g. Main repository, Design mockups..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !url.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {initial?.id ? 'Save Changes' : 'Add Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  link: ProjectLink | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteDialog({ link, onClose, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = React.useState(false);
  return (
    <Dialog open={!!link} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove Link</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{link?.name}</strong>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await onConfirm();
              setDeleting(false);
            }}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyLinks({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Link2 className="w-6 h-6 text-[#1A6DB6]" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">No links yet</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        Add links to GitHub, Jira, Figma, Google Drive, or any other external tool used in this project.
      </p>
      <Button onClick={onAdd} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add First Link
      </Button>
    </div>
  );
}

// ── Quick-add presets ─────────────────────────────────────────────────────────

const PRESETS = [
  'GitHub', 'Jira', 'Figma', 'Google Drive', 'Notion', 'Bitbucket', 'GitLab', 'Linear',
];

// ── Link Row Card ─────────────────────────────────────────────────────────────

interface LinkRowProps {
  link: ProjectLink;
  onEdit: (link: ProjectLink) => void;
  onDelete: (link: ProjectLink) => void;
}

function LinkRow({ link, onEdit, onDelete }: LinkRowProps) {
  const [copied, setCopied] = React.useState(false);
  const hostname = getHostname(link.url);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200">
      {/* Service icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
        <ServiceIcon url={link.url} name={link.name} size={20} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-slate-800 text-sm truncate block">{link.name}</span>
        <span className="text-xs text-slate-400 truncate max-w-xs block mt-0.5">{hostname}</span>
        {link.description && (
          <p className="text-xs text-slate-500 mt-1 truncate">{link.description}</p>
        )}
      </div>

      {/* Desktop actions (hidden until hover) */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-600"
          onClick={handleCopy}
          title="Copy URL"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-emerald-500" />
            : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            )
          }
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-600"
          onClick={() => onEdit(link)}
          title="Edit link"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-500"
          onClick={() => onDelete(link)}
          title="Remove link"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:text-[#1A6DB6] hover:bg-blue-50 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Mobile always-visible open button */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="md:hidden flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:text-[#1A6DB6]"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectLinksPage() {
  const params  = useParams();
  const pid     = params.id as string;

  const [links,    setLinks]    = React.useState<ProjectLink[]>([]);
  const [loading,  setLoading]  = React.useState(true);
  const [showAdd,  setShowAdd]  = React.useState(false);
  const [editing,  setEditing]  = React.useState<ProjectLink | null>(null);
  const [deleting, setDeleting] = React.useState<ProjectLink | null>(null);
  const [presetName, setPreset] = React.useState('');

  const fetchLinks = React.useCallback(async () => {
    try {
      const res  = await fetch(`/api/projects/${pid}/links`);
      const json = await res.json();
      setLinks(json.data ?? []);
    } catch {
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  }, [pid]);

  React.useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleAdd = async (data: { name: string; url: string; description: string }) => {
    const res = await fetch(`/api/projects/${pid}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message ?? 'Failed to add link'); }
    toast.success('Link added successfully');
    setShowAdd(false);
    setPreset('');
    await fetchLinks();
  };

  const handleEdit = async (data: { name: string; url: string; description: string }) => {
    if (!editing) return;
    const res = await fetch(`/api/projects/${pid}/links/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message ?? 'Failed to update link'); }
    toast.success('Link updated');
    setEditing(null);
    await fetchLinks();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/projects/${pid}/links/${deleting.id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); toast.error(e.error?.message ?? 'Failed to delete'); return; }
    toast.success('Link removed');
    setDeleting(null);
    await fetchLinks();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 font-heading">Project Links</h3>
          <p className="text-sm text-slate-500 mt-0.5">External resources and tools for this project.</p>
        </div>
        <Button onClick={() => { setPreset(''); setShowAdd(true); }} className="gap-2" id="add-link-btn">
          <Plus className="h-4 w-4" />
          Add Link
        </Button>
      </div>

      {/* Link list or empty state */}
      {links.length === 0 ? (
        <>
          <EmptyLinks onAdd={() => setShowAdd(true)} />
          {/* Quick-add preset chips */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Quick add a service
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPreset(p); setShowAdd(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:border-[#1A6DB6] hover:text-[#1A6DB6] hover:bg-blue-50 transition-all duration-150 shadow-sm"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <LinkRow key={link.id} link={link} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <LinkFormDialog
        open={showAdd}
        onClose={() => { setShowAdd(false); setPreset(''); }}
        onSave={handleAdd}
        initial={presetName ? { name: presetName } : undefined}
      />

      {/* Edit Dialog */}
      <LinkFormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleEdit}
        initial={editing ?? undefined}
      />

      {/* Delete Confirm */}
      <DeleteDialog
        link={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
