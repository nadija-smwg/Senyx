'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DealForm } from '@/components/sales/deal-form';

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

function DealCard({ deal }: { deal: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'Deal', deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-3 touch-none ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <Card className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
        <CardContent className="p-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="font-semibold text-sm hover:underline text-left" onClick={(e) => e.stopPropagation()}>
                {deal.name}
              </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto" onPointerDown={(e) => e.stopPropagation()}>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold font-heading">Edit Deal</SheetTitle>
              </SheetHeader>
              <DealForm 
                initialData={{
                  id: deal.id,
                  name: deal.name,
                  accountId: deal.accountId,
                  amount: deal.amount,
                  currency: deal.currency,
                  expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
                  source: deal.source || '',
                }} 
              />
            </SheetContent>
          </Sheet>
          <div className="text-xs text-muted-foreground mt-1 mb-2">
            Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD' }).format(deal.amount)}
          </div>
          <div className="flex justify-between items-center text-xs">
            <Badge variant="secondary" className="text-[10px]">{deal.probability}% Win</Badge>
            <span className={deal.health?.riskFlag ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {deal.health?.daysInStage || 0}d in stage
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Column({ stage, deals }: { stage: string, deals: any[] }) {
  const totalAmount = deals.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-muted/40 rounded-lg p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold capitalize">{stage}</h3>
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
          {deals.length}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mb-4">
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalAmount)}
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-[150px]">
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ deals, onStageChange }: { deals: any[], onStageChange: (dealId: string, newStage: string) => void }) {
  const [activeDeal, setActiveDeal] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const deal = deals.find(d => d.id === active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: any) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    // Check if dropped over another deal
    const activeDeal = deals.find(d => d.id === active.id);
    const overDeal = deals.find(d => d.id === over.id);
    
    let newStage = activeDeal?.stage;

    if (overDeal) {
      newStage = overDeal.stage;
    } else {
      // It might be dropped on a column (if we registered columns as droppable)
      // For simplicity in SortableContext, we rely on dropping on other deals.
      // If a column is empty, we would need a droppable area for it.
      // Let's implement full columns as droppable if needed, but for now we just find the closest.
    }

    if (newStage && activeDeal && activeDeal.stage !== newStage) {
      onStageChange(activeDeal.id, newStage);
    }
  };

  // Group deals by stage
  const columnsData = STAGES.map(stage => ({
    stage,
    deals: deals.filter(d => d.stage === stage)
  }));

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex space-x-4 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
        {columnsData.map(col => (
          <Column key={col.stage} stage={col.stage} deals={col.deals} />
        ))}
      </div>
      
      <DragOverlay dropAnimation={dropAnimation}>
        {activeDeal ? (
          <div className="w-80">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
