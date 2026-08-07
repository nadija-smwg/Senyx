'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BoardColumnProps {
  column: any;
  tasks: any[];
  onAddTask?: (colId: string) => void;
  onTaskClick?: (task: any) => void;
}

export function BoardColumn({ column, tasks, onAddTask, onTaskClick }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const taskIds = React.useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div className="flex flex-col w-[300px] shrink-0 bg-muted/50 rounded-lg">
      <div className="p-3 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span>{column.name}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 p-2 overflow-y-auto min-h-[150px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="flex flex-col gap-2 min-h-full">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onClick={() => onTaskClick?.(task)}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      <div className="p-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAddTask?.(column.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
