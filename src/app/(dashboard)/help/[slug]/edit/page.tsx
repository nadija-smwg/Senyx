'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft, Loader2, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

export default function EditHelpPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/help/${params.slug}`);
        const data = await res.json();
        if (data.success) {
          setTitle(data.data.title);
          setContent(data.data.content);
          setRoles(data.data.roles || []);
        } else {
          setError(data.error || 'Failed to load article');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [params.slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/help/${params.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, roles })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/help');
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (err) {
      alert('Error saving article');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="p-20 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <PageHeader 
        title="Edit Help Article" 
        description={`Editing content for slug: ${params.slug}`}
      >
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/help"><ArrowLeft className="w-4 h-4 mr-2" /> Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </PageHeader>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-4 border-b space-y-4">
          <div className="flex gap-4 items-center">
            <div className="w-24 font-medium text-sm text-muted-foreground">Title</div>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 p-2 border rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="w-24 font-medium text-sm text-muted-foreground">Access Roles</div>
            <div className="flex-1 flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={roles.length === 0} 
                  onChange={(e) => {
                    if (e.target.checked) setRoles([]);
                  }} 
                  className="rounded text-primary focus:ring-primary"
                />
                Public (All Users)
              </label>
              {/* Optional: Render specific role checkboxes for fine-grained control if needed */}
              {roles.length > 0 && <span className="text-muted-foreground italic text-xs">Currently restricted to: {roles.join(', ')}</span>}
            </div>
          </div>
        </div>

        <div className="flex border-b bg-muted/20">
          <button 
            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'edit' ? 'bg-card border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => setActiveTab('edit')}
          >
            <Edit3 className="w-4 h-4" /> Markdown Editor
          </button>
          <button 
            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'preview' ? 'bg-card border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="w-4 h-4" /> Live Preview
          </button>
        </div>

        <div className="flex-1 relative bg-card">
          {activeTab === 'edit' ? (
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
              placeholder="Write your markdown here..."
            />
          ) : (
            <div className="absolute inset-0 overflow-y-auto p-8 prose prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900/50">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*No content provided.*'}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
