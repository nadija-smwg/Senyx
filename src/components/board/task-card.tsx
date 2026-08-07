'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, GripVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TaskCardProps {
  task: any;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 border-2 border-primary rounded-lg h-[100px] w-full"
      />
    );
  }

  const priorityColors = {
    urgent: 'bg-red-500 hover:bg-red-600',
    high: 'bg-orange-500 hover:bg-orange-600',
    medium: 'bg-yellow-500 hover:bg-yellow-600',
    low: 'bg-green-500 hover:bg-green-600',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:border-primary/50 group"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 truncate">
            <span className="text-sm font-medium">{task.title}</span>
          </div>
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Badge className={`text-[10px] h-4 px-1 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
              {task.priority}
            </Badge>
            {task.dueDate && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{task.assigneeId ? 'USR' : '?'}</AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>
  );
}
