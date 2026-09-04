'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Contact,
} from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

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

// Themed section header (Orange theme for contacts)
type FormTheme = 'green' | 'blue' | 'orange';

const themeStyles: Record<FormTheme, {
  gradient: string;
  ring: string;
  icon: string;
  btnGradient: string;
  btnGradientHover: string;
  btnShadow: string;
}> = {
  green: {
    gradient: 'from-[#34D399]/15 to-[#10B981]/10',
    ring: 'ring-[#10B981]/25',
    icon: 'text-[#047857]',
    btnGradient: 'from-[#059669] to-[#10B981]',
    btnGradientHover: 'hover:from-[#047857] hover:to-[#059669]',
    btnShadow: 'shadow-emerald-500/25',
  },
  blue: {
    gradient: 'from-[#22BFE8]/15 to-[#1A6DB6]/10',
    ring: 'ring-[#22BFE8]/20',
    icon: 'text-[#1A6DB6]',
    btnGradient: 'from-[#1A6DB6] to-[#22BFE8]',
    btnGradientHover: 'hover:from-[#155a96] hover:to-[#1ca2c5]',
    btnShadow: 'shadow-[#1A6DB6]/20',
  },
  orange: {
    gradient: 'from-[#FB923C]/15 to-[#F97316]/10',
    ring: 'ring-[#F97316]/25',
    icon: 'text-[#C2410C]',
    btnGradient: 'from-[#EA580C] to-[#F97316]',
    btnGradientHover: 'hover:from-[#C2410C] hover:to-[#EA580C]',
    btnShadow: 'shadow-orange-500/25',
  },
};

function SectionHeader({
  icon,
  title,
  description,
  theme = 'orange',
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  theme?: FormTheme;
}) {
  const t = themeStyles[theme];
  return (
    <div className="flex items-start gap-3">
      <div className={cn('h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center ring-1', t.gradient, t.ring)}>
        <span className={t.icon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export function ContactForm({ initialData, defaultAccountId, onSuccess, onCancel }: ContactFormProps) {
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = React.useState(false);
  const isEdit = !!initialData?.id;
  const theme: FormTheme = 'orange';
  const t = themeStyles[theme];

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
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        if (data.data) {
          setAccounts(data.data);
        }
      } catch (error) {
        toast.error('Failed to load accounts');
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
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

      toast.success(`Contact ${isEdit ? 'updated' : 'created'} successfully`, {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      });
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', {
        icon: <AlertCircle className="h-4 w-4 text-rose-600" />,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col animate-in slide-in-from-left-4 fade-in duration-300"
      >
        <div className="space-y-7">
          {/* Contact Identity */}
          <section className="space-y-4">
            <SectionHeader
              icon={<Contact className="h-4 w-4" />}
              title="Contact Identity"
              description="Account and personal details."
              theme={theme}
            />

            <FormField
              control={form.control as any}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    Account <span className="text-rose-500">*</span>
                  </FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      First Name <span className="text-rose-500">*</span>
                    </FormLabel>
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
                    <FormLabel className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-400" />
                      Last Name
                    </FormLabel>
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
                  <FormLabel className="flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3 text-slate-400" />
                    Job Title
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="CTO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Reach & Role */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Mail className="h-4 w-4" />}
              title="Reach & Role"
              description="How to contact this person and their role."
              theme={theme}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400" />
                      Email
                    </FormLabel>
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
                    <FormLabel className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400" />
                      Phone
                    </FormLabel>
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-orange-200/70 bg-gradient-to-br from-orange-50/40 to-amber-50/30 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-[#F97316] data-[state=checked]:border-[#F97316]"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Primary Contact
                    </FormLabel>
                    <p className="text-sm text-slate-500">
                      Set as the primary contact for this account.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </section>
        </div>

        {/* Sticky Action Bar */}
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
                'gap-2 shadow-sm border-0 text-white font-semibold transition-all bg-gradient-to-r',
                t.btnGradient,
                t.btnGradientHover,
                t.btnShadow,
                form.formState.isSubmitting && 'opacity-90'
              )}
            >
              {form.formState.isSubmitting && <Spinner className="h-3.5 w-3.5" />}
              {form.formState.isSubmitting
                ? isEdit
                  ? 'Updating contact...'
                  : 'Creating contact...'
                : isEdit
                  ? 'Update Contact'
                  : 'Add Contact'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
