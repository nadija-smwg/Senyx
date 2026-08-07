'use client';
import { PhoneCall, Mail, Calendar, StickyNote } from 'lucide-react';
import { format } from 'date-fns';

type Interaction = {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  subject: string;
  notes?: string | null;
  occurredAt: string | Date;
  loggedById: string;
};

const iconMap = {
  call: <PhoneCall className="w-4 h-4 text-blue-500" />,
  email: <Mail className="w-4 h-4 text-emerald-500" />,
  meeting: <Calendar className="w-4 h-4 text-purple-500" />,
  note: <StickyNote className="w-4 h-4 text-amber-500" />,
};

const bgMap = {
  call: 'bg-blue-500/10 border-blue-500/20',
  email: 'bg-emerald-500/10 border-emerald-500/20',
  meeting: 'bg-purple-500/10 border-purple-500/20',
  note: 'bg-amber-500/10 border-amber-500/20',
};

export function InteractionTimeline({ interactions }: { interactions: Interaction[] }) {
  if (interactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No interactions logged yet.</div>;
  }

  return (
    <div className="relative border-l border-border ml-4 space-y-6 pb-4">
      {interactions.map((interaction) => (
        <div key={interaction.id} className="relative pl-6">
          <div className={`absolute -left-3 top-1 w-6 h-6 rounded-full flex items-center justify-center border bg-background ${bgMap[interaction.type]}`}>
            {iconMap[interaction.type]}
          </div>
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm">{interaction.subject}</h4>
              <time className="text-xs text-muted-foreground">
                {format(new Date(interaction.occurredAt), 'MMM d, yyyy h:mm a')}
              </time>
            </div>
            {interaction.notes && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
