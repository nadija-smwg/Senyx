'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

interface ContactFormProps {
  initialData?: z.infer<typeof formSchema> & { id?: string };
  defaultAccountId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({ initialData, defaultAccountId, onSuccess, onCancel }: ContactFormProps) {
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = React.useState(false);
  const isEdit = !!initialData?.id;

  const form = useForm({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData || {
      accountId: defaultAccountId || '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      isPrimary: false,
    },
  });

  React.useEffect(() => {
    setLoadingAccounts(true);
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setAccounts(data.data);
        }
      })
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoadingAccounts(false));
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const endpoint = isEdit ? `/api/contacts/${initialData.id}` : '/api/contacts';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `Failed to ${isEdit ? 'update' : 'create'} contact`);
      }

      toast.success(`Contact ${isEdit ? 'updated' : 'created'} successfully`);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control as any}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingAccounts ? "Loading accounts..." : "Select an account"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control as any}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="CTO" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control as any}
            name="isPrimary"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Primary Contact
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Set as the primary contact for this account.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="pt-4 flex justify-end space-x-2 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
