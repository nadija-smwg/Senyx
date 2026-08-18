'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const schema = z.object({
  name: z.string().min(1, 'Account name is required'),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url('Must be a valid URL (e.g. https://example.com)').optional().or(z.literal('')),
  status: z.enum(['prospect', 'active', 'inactive']),
  ownerId: z.string().uuid('Please select an owner').optional().or(z.literal('')),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
});

interface AccountFormProps {
  initialData?: z.infer<typeof schema> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AccountForm({ initialData, onSuccess, onCancel }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const isEdit = !!initialData?.id;

  useEffect(() => {
    fetch('/api/employees?minimal=true')
      .then(res => res.json())
      .then(json => {
        if (json.data) setEmployees(json.data);
      })
      .catch(console.error);
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      name: '',
      industry: '',
      size: '',
      website: '',
      status: 'prospect',
      ownerId: '',
      contactName: '',
      contactEmail: '',
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isEdit ? `/api/accounts/${initialData.id}` : '/api/accounts';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Failed to ${isEdit ? 'update' : 'create'} account`);
      
      let contactError = null;
      if (!isEdit && (values.contactName || values.contactEmail)) {
        try {
          const contactRes = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId: data.data.id,
              firstName: values.contactName?.split(' ')[0] || (values.contactEmail ? values.contactEmail.split('@')[0] : 'Unknown'),
              lastName: values.contactName?.split(' ').slice(1).join(' ') || '',
              email: values.contactEmail,
              status: 'active',
            })
          });
          if (!contactRes.ok) {
            const err = await contactRes.json();
            contactError = err.error?.message || 'Failed to create contact';
          }
        } catch (e: any) {
          contactError = e.message;
        }
      }

      if (contactError) {
        toast.warning(`Account created, but contact failed: ${contactError}`);
      } else {
        toast.success(`Account ${isEdit ? 'updated' : 'created'} successfully!`);
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="Software" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size</FormLabel>
                  <FormControl>
                    <Input placeholder="1-50 employees" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" type="url" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    {...field}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="active">Active Client</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ownerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Owner</FormLabel>
                <FormControl>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    {...field}
                  >
                    <option value="">Select an owner...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isEdit && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold">Primary Contact (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-2 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Account' : 'Create Account')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
