'use client';

import * as React from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { BoardColumn } from './board-column';
import { TaskCard } from './task-card';
import { TaskDetailModal } from './task-detail-modal';
import { toast } from 'sonner';

interface KanbanBoardProps {
  initialColumns: any[];
  projectId: string;
}

export function KanbanBoard({ initialColumns, projectId }: KanbanBoardProps) {
  const [columns, setColumns] = React.useState(initialColumns);
  const [activeTask, setActiveTask] = React.useState<any | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);
  const [filterText, setFilterText] = React.useState('');
  const [filterPriority, setFilterPriority] = React.useState('all');
  const [filterAssignee, setFilterAssignee] = React.useState('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Collect unique assignees from all tasks for filter dropdown
  const allTasks = columns.flatMap(c => c.tasks);
  const uniqueAssignees = Array.from(
    new Map(allTasks.filter(t => t.assigneeId).map(t => [t.assigneeId, t.assigneeId])).values()
  );

  // Apply filters to columns
  const filteredColumns = columns.map(col => ({
    ...col,
    tasks: col.tasks.filter((t: any) => {
      if (filterText && !t.title.toLowerCase().includes(filterText.toLowerCase())) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterAssignee !== 'all' && t.assigneeId !== filterAssignee) return false;
      return true;
    }),
  }));

  const handleAddTask = async (columnId: string) => {
    const title = prompt('Enter task title:');
    if (!title?.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), columnId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create task');
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, json.data] }
          : col
      ));
      toast.success('Task created');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleTaskUpdated = (taskId: string, updated: any | null) => {
    if (updated === null) {
      // Task deleted — remove from columns
      setColumns(prev => prev.map(col => ({
        ...col,
        tasks: col.tasks.filter((t: any) => t.id !== taskId),
      })));
    } else {
      // Task updated — replace in columns
      setColumns(prev => prev.map(col => ({
        ...col,
        tasks: col.tasks.map((t: any) => t.id === taskId ? { ...t, ...updated } : t),
      })));
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task;
    if (task) setActiveTask(task);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setColumns(prev => {
        const activeColIdx = prev.findIndex(col => col.tasks.some((t: any) => t.id === activeId));
        const overColIdx = prev.findIndex(col => col.tasks.some((t: any) => t.id === overId));
        if (activeColIdx === -1 || overColIdx === -1) return prev;

        const activeTaskIdx = prev[activeColIdx].tasks.findIndex((t: any) => t.id === activeId);
        const overTaskIdx = prev[overColIdx].tasks.findIndex((t: any) => t.id === overId);

        if (activeColIdx === overColIdx) {
          const newCols = [...prev];
          newCols[activeColIdx] = {
            ...newCols[activeColIdx],
            tasks: arrayMove(newCols[activeColIdx].tasks, activeTaskIdx, overTaskIdx),
          };
          return newCols;
        }

        const newCols = prev.map(c => ({ ...c, tasks: [...c.tasks] }));
        const taskToMove = { ...newCols[activeColIdx].tasks[activeTaskIdx], columnId: newCols[overColIdx].id };
        newCols[activeColIdx].tasks.splice(activeTaskIdx, 1);
        newCols[overColIdx].tasks.splice(overTaskIdx, 0, taskToMove);
        return newCols;
      });
    }

    if (isActiveTask && isOverColumn) {
      setColumns(prev => {
        const activeColIdx = prev.findIndex(col => col.tasks.some((t: any) => t.id === activeId));
        const overColIdx = prev.findIndex(col => col.id === overId);
        if (activeColIdx === -1 || overColIdx === -1 || activeColIdx === overColIdx) return prev;

        const newCols = prev.map(c => ({ ...c, tasks: [...c.tasks] }));
        const taskIdx = newCols[activeColIdx].tasks.findIndex((t: any) => t.id === activeId);
        const taskToMove = { ...newCols[activeColIdx].tasks[taskIdx], columnId: newCols[overColIdx].id };
        newCols[activeColIdx].tasks.splice(taskIdx, 1);
        newCols[overColIdx].tasks.push(taskToMove);
        return newCols;
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    let finalColumnId: string | null = null;
    let finalIndex = -1;

    for (const col of columns) {
      const idx = col.tasks.findIndex((t: any) => t.id === activeId);
      if (idx !== -1) {
        finalColumnId = col.id;
        finalIndex = idx;
        break;
      }
    }

    if (!finalColumnId) return;

    const targetColumn = columns.find(c => c.id === finalColumnId);
    if (!targetColumn) return;

    let newPosition = 1024;
    if (targetColumn.tasks.length > 1) {
      if (finalIndex === 0) {
        newPosition = (targetColumn.tasks[1]?.position || 1024) / 2;
      } else if (finalIndex === targetColumn.tasks.length - 1) {
        newPosition = (targetColumn.tasks[finalIndex - 1]?.position || 0) + 1024;
      } else {
        const prevPos = targetColumn.tasks[finalIndex - 1]?.position || 0;
        const nextPos = targetColumn.tasks[finalIndex + 1]?.position || prevPos + 1024;
        newPosition = (prevPos + nextPos) / 2;
      }
    }

    try {
      const res = await fetch(`/api/tasks/${activeId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: finalColumnId, position: newPosition }),
      });
      if (!res.ok) throw new Error('Move failed');
    } catch {
      toast.error('Failed to save task position');
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {(filterText || filterPriority !== 'all' || filterAssignee !== 'all') && (
          <button
            onClick={() => { setFilterText(''); setFilterPriority('all'); setFilterAssignee('all'); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-300px)] min-h-[500px]">
          {filteredColumns.map(col => (
            <BoardColumn
              key={col.id}
              column={col}
              tasks={col.tasks}
              onAddTask={handleAddTask}
              onTaskClick={(task) => setSelectedTask(task)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => {
            handleTaskUpdated(selectedTask.id, updated);
            setSelectedTask(null);
          }}
          projectId={projectId}
        />
      )}
    </div>
  );
}
