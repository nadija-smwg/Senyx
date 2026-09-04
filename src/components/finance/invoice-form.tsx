'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FileText,
  Building2,
  FolderKanban,
  Calendar,
  Wallet,
  ListChecks,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Schemas (using string inputs for numbers; converted at submit) ─────────

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().min(1, 'Qty is required'),
  unitPrice: z.string().min(1, 'Price is required'),
});

const schema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  projectId: z.string().optional(),
  currency: z.string(),
  dueDate: z.string().optional(),
  taxRate: z.string(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type FormValues = z.infer<typeof schema>;

interface InvoiceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ── Section Header helper ────────────────────────────────────────────────────
// Themed section header (Blue theme for invoices)
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

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const router = useRouter();
  const [accountsList, setAccountsList] = useState<{ id: string; name: string }[]>([]);
  const [projectsList, setProjectsList] = useState<
    { id: string; name: string; accountId: string }[]
  >([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any, any, FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      accountId: '',
      projectId: '',
      currency: 'USD',
      dueDate: '',
      taxRate: '0',
      lineItems: [{ id: '1', description: '', quantity: '1', unitPrice: '0' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: form.control as any,
    name: 'lineItems',
  });

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((d) => setAccountsList(d.data || []));
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjectsList(d.data || []));
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        const settings = d.data || [];
        const taxSetting = settings.find((s: { key: string }) => s.key === 'invoice.tax_rate');
        if (taxSetting) {
          const val = parseFloat(JSON.parse(taxSetting.value));
          if (!isNaN(val)) form.setValue('taxRate', String(val));
        }
      })
      .catch((e) => console.error('Failed to fetch settings', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedAccountId = form.watch('accountId');
  const filteredProjects = projectsList.filter(
    (p) => !watchedAccountId || p.accountId === watchedAccountId
  );

  const lineItems: FormValues['lineItems'] = form.watch('lineItems') || [];
  const taxRateStr: string = form.watch('taxRate') ?? '0';
  const currency: string = form.watch('currency') ?? 'USD';

  const subtotal = lineItems.reduce(
    (acc, item) => acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0
  );
  const taxRate = parseFloat(taxRateStr) || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount || 0);

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        accountId: values.accountId,
        projectId: values.projectId || null,
        dueDate: values.dueDate || null,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        currency: values.currency,
        lineItems: values.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toString(),
        })),
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create invoice');

      toast.success('Invoice created successfully!', {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      });

      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message, {
        icon: <AlertCircle className="h-4 w-4 text-rose-600" />,
      });
    }
  }

  return (
    <Form {...form}>
      <form
        id="invoice-form"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSubmit={form.handleSubmit(onSubmit as any)}
        className="flex flex-col animate-in slide-in-from-left-4 fade-in duration-300"
      >
        <div className="space-y-7">
          {/* ── Invoice Details ──────────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              icon={<FileText className="h-4 w-4" />}
              title="Invoice Details"
              description="Client account, project and basic terms."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                control={form.control as any}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      Client Account <span className="text-rose-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue('projectId', '');
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountsList.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                control={form.control as any}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <FolderKanban className="h-3 w-3 text-slate-400" />
                      Project (Optional)
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!watchedAccountId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {filteredProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                control={form.control as any}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Due Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                control={form.control as any}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Wallet className="h-3 w-3 text-slate-400" />
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

          {/* ── Line Items ───────────────────────────────────────────────── */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<ListChecks className="h-4 w-4" />}
              title="Line Items"
              description="What you're billing for."
            />

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 items-start rounded-xl border border-slate-200 bg-slate-50/40 p-2.5"
                >
                  <FormField
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    control={form.control as any}
                    name={`lineItems.${index}.description`}
                    render={({ field: f }) => (
                      <FormItem className="col-span-12 sm:col-span-6">
                        {index === 0 && (
                          <FormLabel className="text-[10px] uppercase tracking-wider text-slate-500">
                            Description
                          </FormLabel>
                        )}
                        <FormControl>
                          <Input
                            placeholder="Service or item description"
                            {...f}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    control={form.control as any}
                    name={`lineItems.${index}.quantity`}
                    render={({ field: f }) => (
                      <FormItem className="col-span-4 sm:col-span-2">
                        {index === 0 && (
                          <FormLabel className="text-[10px] uppercase tracking-wider text-slate-500">
                            Qty
                          </FormLabel>
                        )}
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="1"
                            {...f}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    control={form.control as any}
                    name={`lineItems.${index}.unitPrice`}
                    render={({ field: f }) => (
                      <FormItem className="col-span-4 sm:col-span-2">
                        {index === 0 && (
                          <FormLabel className="text-[10px] uppercase tracking-wider text-slate-500">
                            Price
                          </FormLabel>
                        )}
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...f}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-3 sm:col-span-1">
                    {index === 0 && (
                      <FormLabel className="text-[10px] uppercase tracking-wider text-slate-500 block">
                        Amount
                      </FormLabel>
                    )}
                    <div className="h-10 flex items-center px-2 text-sm font-semibold text-slate-700 bg-white rounded-md border border-slate-200 truncate">
                      {formatMoney(
                        (parseFloat(lineItems[index]?.quantity ?? '0') || 0) *
                        (parseFloat(lineItems[index]?.unitPrice ?? '0') || 0)
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-end justify-end h-full pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className={cn(
                        'text-slate-400 hover:text-rose-600 hover:bg-rose-50',
                        fields.length === 1 && 'opacity-40 cursor-not-allowed'
                      )}
                      aria-label="Remove line item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    id: Math.random().toString(),
                    description: '',
                    quantity: '1',
                    unitPrice: '0',
                  })
                }
                className="gap-1.5 border-dashed border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Line Item
              </Button>
            </div>
          </section>

          {/* ── Summary ──────────────────────────────────────────────────── */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Calculator className="h-4 w-4" />}
              title="Summary"
              description="Subtotal, tax and final total."
            />

            <div className="ml-auto w-full max-w-sm rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-700">
                  {formatMoney(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm gap-3">
                <span className="text-slate-500 shrink-0">Tax Rate</span>
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem className="m-0">
                      <FormControl>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            className="h-8 w-20 text-right text-sm"
                            {...field}
                          />
                          <span className="text-slate-500 text-xs">%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-semibold text-slate-700">
                  {formatMoney(tax)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-slate-200">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-[#DC2626]" />
                  Total
                </span>
                <span className="text-lg font-bold bg-gradient-to-r from-[#DC2626] to-[#EF4444] bg-clip-text text-transparent">
                  {formatMoney(total)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ── Sticky Action Bar ─────────────────────────────────────────── */}
        <div className="sticky bottom-0 -mx-6 mt-8 px-6 py-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            {onCancel && (
              <Button
                variant="outline"
                type="button"
                onClick={onCancel}
                disabled={form.formState.isSubmitting}
                className="sm:w-auto"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className={cn(
                'gap-2 shadow-sm shadow-[#DC2626]/20 bg-gradient-to-r from-[#DC2626] to-[#EF4444] hover:from-[#B91C1C] hover:to-[#DC2626] border-0 text-white font-semibold transition-all',
                form.formState.isSubmitting && 'opacity-90'
              )}
            >
              {form.formState.isSubmitting && <Spinner className="h-3.5 w-3.5" />}
              {form.formState.isSubmitting ? 'Saving invoice...' : 'Save Draft'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
