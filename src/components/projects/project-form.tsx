'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FolderKanban,
  Building2,
  Wallet,
  Calendar,
  Users,
  Briefcase,
  UserCog,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Globe,
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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Check, ChevronsUpDown, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectFormProps {
  initialData?: any;
  fromDealId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ROLES = ['DevOps', 'Front-end', 'Back-end', 'Marketing', 'QA'];

const schema = z.object({
  name: z.string().min(1, 'Project name is required'),
  companyName: z.string().optional(),
  accountId: z.string().optional(),
  ownerId: z.string().optional(),
  type: z.enum(['solution', 'product', 'internal']),
  billingType: z.enum(['fixed', 'hourly', 'milestone']),
  budget: z.string().optional(),
  currency: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
  {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }
);

type FormValues = z.infer<typeof schema>;

// Themed section header (Green theme for projects)
type FormTheme = 'green' | 'blue' | 'orange';

const themeStyles: Record<FormTheme, {
  gradient: string;
  ring: string;
  icon: string;
  calloutBorder: string;
  calloutBg: string;
  calloutText: string;
  calloutIcon: string;
  btnGradient: string;
  btnGradientHover: string;
  btnShadow: string;
}> = {
  green: {
    gradient: 'from-[#34D399]/15 to-[#10B981]/10',
    ring: 'ring-[#10B981]/25',
    icon: 'text-[#047857]',
    calloutBorder: 'border-emerald-200',
    calloutBg: 'bg-gradient-to-br from-emerald-50/60 to-green-50/40',
    calloutText: 'text-emerald-800',
    calloutIcon: 'text-[#047857]',
    btnGradient: 'from-[#059669] to-[#10B981]',
    btnGradientHover: 'hover:from-[#047857] hover:to-[#059669]',
    btnShadow: 'shadow-emerald-500/25',
  },
  blue: {
    gradient: 'from-[#22BFE8]/15 to-[#1A6DB6]/10',
    ring: 'ring-[#22BFE8]/20',
    icon: 'text-[#1A6DB6]',
    calloutBorder: 'border-blue-100',
    calloutBg: 'bg-gradient-to-br from-blue-50/60 to-cyan-50/40',
    calloutText: 'text-blue-800',
    calloutIcon: 'text-[#1A6DB6]',
    btnGradient: 'from-[#1A6DB6] to-[#22BFE8]',
    btnGradientHover: 'hover:from-[#155a96] hover:to-[#1ca2c5]',
    btnShadow: 'shadow-[#1A6DB6]/20',
  },
  orange: {
    gradient: 'from-[#FB923C]/15 to-[#F97316]/10',
    ring: 'ring-[#F97316]/25',
    icon: 'text-[#C2410C]',
    calloutBorder: 'border-orange-200',
    calloutBg: 'bg-gradient-to-br from-orange-50/60 to-amber-50/40',
    calloutText: 'text-orange-800',
    calloutIcon: 'text-[#C2410C]',
    btnGradient: 'from-[#EA580C] to-[#F97316]',
    btnGradientHover: 'hover:from-[#C2410C] hover:to-[#EA580C]',
    btnShadow: 'shadow-orange-500/25',
  },
};

function SectionHeader({
  icon,
  title,
  description,
  theme = 'blue',
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

export function ProjectForm({ fromDealId, onSuccess, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const theme: FormTheme = 'green';
  const t = themeStyles[theme];

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [deal, setDeal] = React.useState<any>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);

  const [teamMembers, setTeamMembers] = React.useState<{ id: string; role: string }[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);

  const [accountSearch, setAccountSearch] = React.useState('');
  const [accountOpen, setAccountOpen] = React.useState(false);

  const [ownerSearch, setOwnerSearch] = React.useState('');
  const [developerSearch, setDeveloperSearch] = React.useState('');
  const [ownerOpen, setOwnerOpen] = React.useState(false);
  const [developersOpen, setDevelopersOpen] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    DevOps: false,
    'Front-end': false,
    'Back-end': false,
    Marketing: false,
    QA: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      companyName: '',
      accountId: '',
      ownerId: '',
      type: 'internal',
      billingType: 'fixed',
      budget: '',
      currency: 'USD',
      startDate: '',
      endDate: '',
    },
  });

  React.useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setAccounts(json.data);
      })
      .catch(console.error);

    fetch('/api/employees?minimal=true')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setEmployees(json.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!fromDealId) setLoading(false);
      });

    if (fromDealId) {
      fetch(`/api/deals/${fromDealId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            setDeal(json.data);
            form.reset({
              ...form.getValues(),
              name: json.data.name,
              accountId: json.data.accountId || '',
              budget: json.data.amount?.toString() || '',
            });
          }
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDealId]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        accountId: values.accountId || null,
        ownerId: values.ownerId || null,
        budget: values.budget ? Number(values.budget) : null,
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error?.message || json.error || 'Failed to create project');

      toast.success('Project created successfully!', {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      });

      // Assign developers
      for (const member of teamMembers) {
        await fetch(`/api/projects/${json.data.id}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: member.id,
            roleOnProject: member.role,
            allocationPct: 100,
          }),
        }).catch(console.error); // Best effort
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
      router.push(`/projects/${json.data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', {
        icon: <AlertCircle className="h-4 w-4 text-rose-600" />,
      });
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-slate-500">
        <Spinner className="mr-2 h-4 w-4" />
        <span>Loading form...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col animate-in slide-in-from-left-4 fade-in duration-300"
      >
        <div className="space-y-7">
          {/* Project Identity */}
          <section className="space-y-4">
            <SectionHeader
              icon={<FolderKanban className="h-4 w-4" />}
              title="Project Identity"
              description="Basic details and classification."
              theme={theme}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    Project Name <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme CRM Migration" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-slate-400" />
                      Company Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      Project Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="solution">Solution Delivery</SelectItem>
                        <SelectItem value="product">Product Development</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    Account
                  </FormLabel>
                  <Popover open={accountOpen} onOpenChange={setAccountOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={accountOpen}
                          className={cn(
                            'justify-between font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? accounts.find((acc) => acc.id === field.value)?.name ||
                            field.value
                            : 'Select an account...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search account..."
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-1">
                        {accounts
                          .filter((acc) =>
                            acc.name.toLowerCase().includes(accountSearch.toLowerCase())
                          )
                          .map((acc) => (
                            <div
                              key={acc.id}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                field.onChange(acc.id);
                                setAccountOpen(false);
                                setAccountSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === acc.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {acc.name}
                            </div>
                          ))}
                        {accounts.filter((acc) =>
                          acc.name.toLowerCase().includes(accountSearch.toLowerCase())
                        ).length === 0 && (
                            <div className="py-6 text-center text-sm">No account found.</div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Commercial Details */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Wallet className="h-4 w-4" />}
              title="Commercial Details"
              description="Billing terms, budget and currency."
              theme={theme}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-slate-400" />
                      Billing Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                      </SelectContent>
                    </Select>
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

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Wallet className="h-3 w-3 text-slate-400" />
                    Budget
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Estimated budget for this engagement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Schedule */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Calendar className="h-4 w-4" />}
              title="Schedule"
              description="Project timeline and milestones."
              theme={theme}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Start Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      End Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Team & Ownership */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Users className="h-4 w-4" />}
              title="Team & Ownership"
              description="Assign accountable owner and developers."
              theme={theme}
            />

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1.5">
                    <UserCog className="h-3 w-3 text-slate-400" />
                    Accountable Person (Owner)
                  </FormLabel>
                  <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={ownerOpen}
                          className={cn(
                            'justify-between font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? `${employees.find((emp) => emp.id === field.value)?.firstName || ''} ${employees.find((emp) => emp.id === field.value)?.lastName || ''}`
                            : 'Select an owner...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search owner..."
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                        />
                      </div>
                      {field.value && (
                        <div
                          className="flex cursor-pointer items-center border-b border-red-100 bg-red-50/50 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => {
                            field.onChange("");
                            setOwnerOpen(false);
                            setOwnerSearch('');
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Clear owner selection
                        </div>
                      )}
                      <div className="max-h-[200px] overflow-y-auto p-1">
                        {employees
                          .filter((emp) =>
                            `${emp.firstName} ${emp.lastName}`
                              .toLowerCase()
                              .includes(ownerSearch.toLowerCase())
                          )
                          .map((emp) => (
                            <div
                              key={emp.id}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                field.onChange(emp.id);
                                setOwnerOpen(false);
                                setOwnerSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === emp.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {emp.firstName} {emp.lastName}
                            </div>
                          ))}
                        {employees.filter((emp) =>
                          `${emp.firstName} ${emp.lastName}`
                            .toLowerCase()
                            .includes(ownerSearch.toLowerCase())
                        ).length === 0 && (
                            <div className="py-6 text-center text-sm">No owner found.</div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-xs font-medium leading-none text-slate-700">
                <Users className="h-3 w-3 text-slate-400" />
                Developers
              </label>
              <Popover open={developersOpen} onOpenChange={setDevelopersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={developersOpen}
                    className={cn(
                      'justify-between font-normal',
                      teamMembers.length === 0 && 'text-muted-foreground'
                    )}
                  >
                    {teamMembers.length > 0
                      ? `${teamMembers.length} developer(s) selected`
                      : 'Select developers...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Search developer..."
                      value={developerSearch}
                      onChange={(e) => setDeveloperSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[240px] overflow-y-auto p-1">
                    {(() => {
                      const filteredEmps = employees.filter((emp) =>
                        `${emp.firstName} ${emp.lastName}`
                          .toLowerCase()
                          .includes(developerSearch.toLowerCase())
                      );
                      if (filteredEmps.length === 0) {
                        return (
                          <div className="py-6 text-center text-sm">No developer found.</div>
                        );
                      }

                      return ROLES.map((group) => (
                        <div key={group}>
                          <div
                            className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100"
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedGroups((prev) => ({
                                ...prev,
                                [group]: !prev[group],
                              }));
                            }}
                          >
                            {group}
                            {expandedGroups[group] ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                          {expandedGroups[group] &&
                            filteredEmps.map((emp) => (
                              <div
                                key={emp.id}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTeamMembers((prev) => {
                                    const existingIndex = prev.findIndex(
                                      (m) => m.id === emp.id && m.role === group
                                    );
                                    if (existingIndex >= 0) {
                                      return prev.filter((_, i) => i !== existingIndex);
                                    }
                                    return [...prev, { id: emp.id, role: group }];
                                  });
                                }}
                              >
                                <Checkbox
                                  className="mr-2 pointer-events-none"
                                  checked={teamMembers.some(
                                    (m) => m.id === emp.id && m.role === group
                                  )}
                                />
                                {emp.firstName} {emp.lastName}
                              </div>
                            ))}
                        </div>
                      ));
                    })()}
                  </div>
                </PopoverContent>
              </Popover>
              {teamMembers.length > 0 && (
                <div className="flex flex-col gap-2 mt-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/70">
                  {teamMembers.map((member) => {
                    const emp = employees.find((e) => e.id === member.id);
                    if (!emp) return null;
                    return (
                      <div
                        key={`${member.id}-${member.role}`}
                        className="flex items-center justify-between gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm"
                      >
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            className="h-8 text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-none focus:ring-1 focus:ring-[#10B981]/40 focus:border-[#10B981]"
                            value={member.role}
                            onChange={(e) =>
                              setTeamMembers((prev) =>
                                prev.map((m) =>
                                  m.id === member.id && m.role === member.role
                                    ? { ...m, role: e.target.value }
                                    : m
                                )
                              )
                            }
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            aria-label="Remove developer"
                            onClick={() =>
                              setTeamMembers((prev) =>
                                prev.filter(
                                  (m) => !(m.id === member.id && m.role === member.role)
                                )
                              )
                            }
                            className="text-slate-400 hover:text-rose-600 flex items-center justify-center w-7 h-7 rounded-md hover:bg-rose-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Helpful callout */}
          {deal && (
            <div className={cn('rounded-xl border p-3.5', t.calloutBorder, t.calloutBg)}>
              <div className="flex items-start gap-2.5">
                <Sparkles className={cn('h-4 w-4 mt-0.5 shrink-0', t.calloutIcon)} />
                <p className={cn('text-xs leading-relaxed', t.calloutText)}>
                  <strong className="font-semibold">Pre-filled from deal:</strong>{' '}
                  This project was auto-populated from <strong>{deal.name}</strong>. Adjust
                  the details below and create the project to attach it.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 -mx-6 mt-8 px-6 py-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className={cn(
                'gap-2 shadow-sm border-0 text-white font-semibold transition-all bg-gradient-to-r',
                t.btnGradient,
                t.btnGradientHover,
                t.btnShadow,
                submitting && 'opacity-90'
              )}
            >
              {submitting && <Spinner className="h-3.5 w-3.5" />}
              {submitting ? 'Creating project...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
