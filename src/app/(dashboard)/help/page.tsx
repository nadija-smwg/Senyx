'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { HelpCircle, Search, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';

interface HelpSection {
  slug: string;
  title: string;
  content: string;
  roles: string[];
}

export default function HelpCenterPage() {
  const [sections, setSections] = useState<HelpSection[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.roles?.includes('admin')) {
          setIsAdmin(true);
        }
      });
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      const res = await fetch(`/api/help${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setSections(data.data);
        if (data.data.length > 0 && !activeSlug) {
          setActiveSlug(data.data[0].slug);
        }
        if (data.data.length === 0) {
          setActiveSlug(null);
        } else if (!data.data.find((s: any) => s.slug === activeSlug)) {
          setActiveSlug(data.data[0].slug);
        }
      }
      setLoading(false);
    };

    const timer = setTimeout(() => {
      fetchSections();
    }, 300); // debounce search

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeSection = sections.find(s => s.slug === activeSlug);

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <PageHeader 
        title="Help Center" 
        description="Documentation, guides, and tutorials for using SENYX ERP."
      >
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search help..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-full bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </PageHeader>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 shrink-0 flex flex-col bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Topics</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {loading && sections.length === 0 ? (
              <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : sections.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center">No results found.</div>
            ) : (
              sections.map(section => (
                <button
                  key={section.slug}
                  onClick={() => setActiveSlug(section.slug)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSlug === section.slug 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {section.title}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col relative">
          {activeSection ? (
            <>
              <div className="p-6 border-b flex justify-between items-center bg-muted/5 sticky top-0 z-10 backdrop-blur-md">
                <h2 className="text-2xl font-bold font-heading text-card-foreground">{activeSection.title}</h2>
                {isAdmin && (
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <Link href={`/help/${activeSection.slug}/edit`}>
                      <Edit className="w-4 h-4" /> Edit Article
                    </Link>
                  </Button>
                )}
              </div>
              <div className="p-8 overflow-y-auto prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeSection.content}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
              <HelpCircle className="w-16 h-16 text-muted mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Select a topic</h3>
              <p>Choose a help article from the sidebar to view its contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
