'use client';
import { useState, useEffect } from 'react';
import {
  Handshake,
  Building2,
  Wallet,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  accountId: z.string().min(1, 'Account is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(parseFloat(v)), 'Must be a valid number'),
  currency: z.string(),
  expectedCloseDate: z.string().optional(),
  source: z.string().optional(),
});

interface DealFormProps {
  initialData?: z.infer<typeof schema> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Themed section header (Blue theme for deals)
function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[#F87171]/15 to-[#DC2626]/10 flex items-center justify-center ring-1 ring-[#DC2626]/20 text-[#DC2626]">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export function DealForm({ initialData, onSuccess, onCancel }: DealFormProps) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const isEdit = !!initialData?.id;

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((d) => {
        if (d.data) setAccounts(d.data);
      })
      .catch(console.error);
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      name: '',
      accountId: '',
      amount: '',
      currency: 'USD',
      expectedCloseDate: '',
      source: '',
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);

    try {
      const payload = {
        ...values,
        amount: parseFloat(values.amount).toString(),
        expectedCloseDate: values.expectedCloseDate
          ? new Date(values.expectedCloseDate).toISOString().split('T')[0]
          : null,
      };

      const endpoint = isEdit ? `/api/deals/${initialData.id}` : '/api/deals';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error?.message || `Failed to ${isEdit ? 'update' : 'create'} deal`
        );

      toast.success(`Deal ${isEdit ? 'updated' : 'created'} successfully!`, {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', {
        icon: <AlertCircle className="h-4 w-4 text-rose-600" />,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col animate-in slide-in-from-left-4 fade-in duration-300"
      >
        <div className="space-y-7">
          {/* Deal Summary */}
          <section className="space-y-4">
            <SectionHeader
              icon={<Handshake className="h-4 w-4" />}
              title="Deal Summary"
              description="Name and primary client account for this opportunity."
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    Deal Name <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp - Q4 Licenses" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    Account <span className="text-rose-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account..." />
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
          </section>

          {/* Deal Value */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Wallet className="h-4 w-4" />}
              title="Deal Value"
              description="Estimated amount and billing currency."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-slate-400" />
                      Amount <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="10000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      Currency
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="LKR">LKR (Rs)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Timeline & Source */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Calendar className="h-4 w-4" />}
              title="Timeline & Source"
              description="When this deal is expected to close and where it came from."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Expected Close Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      The date you expect to win this deal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-slate-400" />
                      Lead Source
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inbound">Inbound</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="outbound">Outbound</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="marketing">Marketing Campaign</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 -mx-6 mt-8 px-6 py-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'gap-2 shadow-sm shadow-[#DC2626]/20 bg-gradient-to-r from-[#DC2626] to-[#EF4444] hover:from-[#B91C1C] hover:to-[#DC2626] border-0 text-white font-semibold transition-all',
                loading && 'opacity-90'
              )}
            >
              {loading && <Spinner className="h-3.5 w-3.5" />}
              {loading
                ? isEdit
                  ? 'Updating deal...'
                  : 'Creating deal...'
                : isEdit
                  ? 'Update Deal'
                  : 'Create Deal'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
