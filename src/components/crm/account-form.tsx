'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2,
  Globe,
  Users,
  Briefcase,
  UserCog,
  AlertCircle,
  CheckCircle2,
  Contact,
  Mail,
  Sparkles,
  Tag,
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

const schema = z.object({
  name: z.string().min(1, 'Account name is required'),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z
    .string()
    .url('Must be a valid URL (e.g. https://example.com)')
    .optional()
    .or(z.literal('')),
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

// ── Section Header helper ────────────────────────────────────────────────────
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
      <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[#22BFE8]/15 to-[#1A6DB6]/10 flex items-center justify-center ring-1 ring-[#22BFE8]/20">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export function AccountForm({ initialData, onSuccess, onCancel }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const isEdit = !!initialData?.id;

  useEffect(() => {
    fetch('/api/employees?minimal=true')
      .then((res) => res.json())
      .then((json) => {
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

    try {
      const endpoint = isEdit ? `/api/accounts/${initialData.id}` : '/api/accounts';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error?.message || `Failed to ${isEdit ? 'update' : 'create'} account`
        );

      let contactError = null;
      if (!isEdit && (values.contactName || values.contactEmail)) {
        try {
          const contactRes = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId: data.data.id,
              firstName:
                values.contactName?.split(' ')[0] ||
                (values.contactEmail
                  ? values.contactEmail.split('@')[0]
                  : 'Unknown'),
              lastName: values.contactName?.split(' ').slice(1).join(' ') || '',
              email: values.contactEmail,
              status: 'active',
            }),
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
        toast.success(`Account ${isEdit ? 'updated' : 'created'} successfully!`, {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        });
      }

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
        <div className="space-y-7">
          {/* ── Company Profile ────────────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              icon={<Building2 className="h-4 w-4 text-[#1A6DB6]" />}
              title="Company Profile"
              description="Basic identifying details for this account."
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    Account Name <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-slate-400" />
                      Industry
                    </FormLabel>
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
                    <FormLabel className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-slate-400" />
                      Company Size
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-10">1–10 employees</SelectItem>
                        <SelectItem value="11-50">11–50 employees</SelectItem>
                        <SelectItem value="51-200">51–200 employees</SelectItem>
                        <SelectItem value="201-500">201–500 employees</SelectItem>
                        <SelectItem value="501-1000">501–1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-slate-400" />
                    Website
                  </FormLabel>
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
                  <FormLabel className="flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3 text-slate-400" />
                    Status
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="active">Active Client</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* ── Ownership ─────────────────────────────────────────────────── */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<UserCog className="h-4 w-4 text-[#1A6DB6]" />}
              title="Ownership"
              description="Assign an internal owner for this account."
            />

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    Account Owner
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an owner..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* ── Primary Contact (Create only) ─────────────────────────────── */}
          {!isEdit && (
            <section className="space-y-4 pt-5 border-t border-slate-100">
              <SectionHeader
                icon={<Contact className="h-4 w-4 text-[#1A6DB6]" />}
                title="Primary Contact"
                description="Optional — create the first contact alongside this account."
              />

              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-cyan-50/40 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-[#1A6DB6]" />
                  <p className="text-xs leading-relaxed text-blue-800">
                    <strong className="font-semibold">A contact record will be created</strong>{' '}
                    from the details below and linked to this new account.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        Full Name
                      </FormLabel>
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
                      <FormLabel className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-slate-400" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="john@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          )}
        </div>

        {/* ── Sticky Action Bar ─────────────────────────────────────────── */}
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
                'gap-2 shadow-sm shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold transition-all',
                loading && 'opacity-90'
              )}
            >
              {loading && <Spinner className="h-3.5 w-3.5" />}
              {loading
                ? isEdit
                  ? 'Updating account...'
                  : 'Creating account...'
                : isEdit
                  ? 'Update Account'
                  : 'Create Account'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
