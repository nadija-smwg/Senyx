'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/components/board/kanban-board';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ProjectBoardPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [columns, setColumns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchBoard() {
      try {
        const res = await fetch(`/api/projects/${id}/board`);
        const json = await res.json();
        setColumns(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBoard();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Board Filters / Swimlanes header could go here */}
      <div className="flex items-center space-x-2">
        <Input placeholder="Filter tasks..." className="max-w-xs" />
        {/* Placeholder for assignee/priority filters */}
      </div>

      {columns.length > 0 ? (
        <KanbanBoard initialColumns={columns} projectId={id} />
      ) : (
        <div className="text-center p-8 text-muted-foreground">No columns found.</div>
      )}
    </div>
  );
}
