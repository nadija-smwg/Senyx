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
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DealForm } from '@/components/sales/deal-form';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { AlertTriangle, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEAL_STAGES, DEAL_STAGE_META, type DealStage } from '@/components/crm/crm-shell';

type Deal = {
  id: string;
  name: string;
  accountId: string;
  amount: string | number;
  currency: string;
  stage: string;
  probability: string | number;
  expectedCloseDate?: string | null;
  source?: string | null;
  status?: string;
  health?: {
    daysInStage?: number;
    riskFlag?: boolean;
    history?: Array<{ id?: string; fromStage?: string | null; toStage?: string }>;
  };
};

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'Deal', deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  // Fallback to the "lead" meta entry when an unknown stage is encountered.
  const stageMeta = DEAL_STAGE_META[(DEAL_STAGES as readonly string[]).includes(deal.stage) ? (deal.stage as DealStage) : 'lead'];
  const prob = Math.round(parseFloat(String(deal.probability || '0')) || 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('mb-3 touch-none group', isDragging ? 'opacity-40' : 'opacity-100')}
    >
      <Card className="cursor-grab active:cursor-grabbing hover:border-[#FBD9C9] hover:shadow-[0_6px_18px_rgba(241,90,34,0.10)] transition-all">
        <CardContent className="p-3.5 space-y-2">
          {/* Drag handle + name */}
          <div className="flex items-start gap-2">
            <GripVertical className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0 group-hover:text-[#F15A22] transition-colors" />
            <div className="min-w-0 flex-1">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="text-sm font-semibold text-gray-900 hover:text-[#F15A22] text-left leading-snug w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {deal.name}
                  </button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto" onPointerDown={(e) => e.stopPropagation()}>
                  <SheetHeader className="mb-4">
                    <SheetTitle>Edit Deal</SheetTitle>
                    <SheetDescription>
                      Update details for <span className="font-semibold">{deal.name}</span>.
                    </SheetDescription>
                  </SheetHeader>
                  <DealForm
                    initialData={{
                      id: deal.id,
                      name: deal.name,
                      accountId: deal.accountId,
                      amount: String(deal.amount ?? ''),
                      currency: deal.currency,
                      expectedCloseDate: deal.expectedCloseDate
                        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
                        : '',
                      source: deal.source || '',
                    }}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between gap-2 pl-5">
            <CurrencyDisplay amount={parseFloat(String(deal.amount || '0')) || 0} className="!text-[15px]" />
            {deal.health?.riskFlag && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600">
                <AlertTriangle className="w-3 h-3" />
                At risk
              </span>
            )}
          </div>

          {/* Footer: probability, days in stage */}
          <div className="flex items-center justify-between gap-2 pl-5 pt-1 border-t border-gray-100">
            <Badge variant="secondary" className="text-[10px]">
              {prob}% · Win
            </Badge>
            <span
              className={cn(
                'text-[10px] tabular-nums',
                deal.health?.riskFlag ? 'text-rose-600 font-semibold' : 'text-gray-400'
              )}
            >
              {deal.health?.daysInStage ?? 0}d in stage
            </span>
          </div>

          {/* Progress bar for probability */}
          <div className="pl-5">
            <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', stageMeta.dot)}
                style={{ width: `${Math.min(100, Math.max(0, prob))}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Column({ stage, deals }: { stage: DealStage; deals: Deal[] }) {
  const totalAmount = deals.reduce((sum, d) => sum + (parseFloat(String(d.amount)) || 0), 0);
  const meta = DEAL_STAGE_META[stage];

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
              meta.bg,
              meta.fg,
              meta.border
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </span>
          <span className="text-xs font-semibold text-gray-700 tabular-nums">{deals.length}</span>
        </div>
        <CurrencyDisplay
          amount={totalAmount}
          className="!text-[13px]"
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-2.5 min-h-[160px] bg-gray-50/30">
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.length === 0 ? (
            <div className="h-[120px] flex items-center justify-center text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
              Drop deals here
            </div>
          ) : (
            deals.map(deal => <DealCard key={deal.id} deal={deal} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({
  deals,
  onStageChange,
}: {
  deals: Deal[];
  onStageChange: (dealId: string, newStage: string) => void;
}) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: { active: { id: string | number } }) => {
    const { active } = event;
    const deal = deals.find(d => d.id === active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const activeDeal = deals.find(d => d.id === active.id);
    const overDeal = deals.find(d => d.id === over.id);

    let newStage = activeDeal?.stage;

    if (overDeal) {
      newStage = overDeal.stage;
    }

    if (newStage && activeDeal && activeDeal.stage !== newStage) {
      onStageChange(activeDeal.id, newStage);
    }
  };

  const columnsData = DEAL_STAGES.map(stage => ({
    stage,
    deals: deals.filter(d => d.stage === stage),
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
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
        {columnsData.map(col => (
          <div key={col.stage} className="snap-start">
            <Column stage={col.stage} deals={col.deals} />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeDeal ? (
          <div className="w-80 rotate-2">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
