'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function RoleForm({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create role');
      }
      
      toast.success('Role created successfully');
      setName('');
      setDescription('');
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Error creating role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form id="role-form" onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2 pb-24">
        <div className="space-y-2">
          <label className="text-sm font-medium">Role Name</label>
          <input 
            required
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Sales Manager"
            className="w-full p-2 rounded-md border bg-background text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of the role's purpose"
            rows={3}
            className="w-full p-2 rounded-md border bg-background text-sm resize-none"
          />
        </div>
      </form>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background flex justify-end gap-3 z-10 mt-auto">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          form="role-form"
          type="submit" 
          disabled={loading || !name.trim()}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Role
        </Button>
      </div>
    </div>
  );
}
