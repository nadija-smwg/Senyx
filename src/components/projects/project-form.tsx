'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Check, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectFormProps {
  fromDealId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ROLES = ['DevOps', 'Front-end', 'Back-end', 'Marketing', 'QA'];

export function ProjectForm({ fromDealId, onSuccess, onCancel }: ProjectFormProps) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [deal, setDeal] = React.useState<any>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);

  const [formData, setFormData] = React.useState({
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
  });
  const [teamMembers, setTeamMembers] = React.useState<{id: string, role: string}[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  
  const [accountSearch, setAccountSearch] = React.useState('');
  const [accountOpen, setAccountOpen] = React.useState(false);
  
  const [ownerSearch, setOwnerSearch] = React.useState('');
  const [developerSearch, setDeveloperSearch] = React.useState('');
  const [ownerOpen, setOwnerOpen] = React.useState(false);
  const [developersOpen, setDevelopersOpen] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'DevOps': false, 'Front-end': false, 'Back-end': false, 'Marketing': false, 'QA': false
  });

  React.useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(json => {
        if (json.data) setAccounts(json.data);
      })
      .catch(console.error);

    fetch('/api/employees?minimal=true')
      .then(res => res.json())
      .then(json => {
        if (json.data) setEmployees(json.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!fromDealId) setLoading(false);
      });

    if (fromDealId) {
      fetch(`/api/deals/${fromDealId}`)
        .then(res => res.json())
        .then(json => {
          if (json.data) {
            setDeal(json.data);
            setFormData(prev => ({
              ...prev,
              name: json.data.name,
              accountId: json.data.accountId || '',
              budget: json.data.amount?.toString() || '',
            }));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [fromDealId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      toast.error('End date cannot be before start date');
      return;
    }
    setSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        accountId: formData.accountId || null,
        budget: formData.budget ? Number(formData.budget) : null,
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error?.message || json.error || 'Failed to create project');
      
      toast.success('Project created successfully!');
      
      // Assign developers
      for (const member of teamMembers) {
        await fetch(`/api/projects/${json.data.id}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: member.id, roleOnProject: member.role, allocationPct: 100 }),
        }).catch(console.error); // Best effort
      }
      
      if (onSuccess) onSuccess();
      router.push(`/projects/${json.data.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }



  return (
    <div className="flex flex-col">
      <form id="project-form" onSubmit={handleSubmit} className="space-y-4 pr-2">
        
        <div className="space-y-2 flex flex-col">
          <Label>Account</Label>
          <Popover open={accountOpen} onOpenChange={setAccountOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={accountOpen}
                className={cn(
                  "justify-between font-normal",
                  !formData.accountId && "text-muted-foreground"
                )}
              >
                {formData.accountId
                  ? accounts.find((acc) => acc.id === formData.accountId)?.name || formData.accountId
                  : "Select an account..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search account..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto p-1">
                {accounts
                  .filter(acc => acc.name.toLowerCase().includes(accountSearch.toLowerCase()))
                  .map(acc => (
                    <div
                      key={acc.id}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        setFormData({ ...formData, accountId: acc.id });
                        setAccountOpen(false);
                        setAccountSearch('');
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.accountId === acc.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {acc.name}
                    </div>
                  ))}
                {accounts.filter(acc => acc.name.toLowerCase().includes(accountSearch.toLowerCase())).length === 0 && (
                  <div className="py-6 text-center text-sm">No account found.</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input 
            value={formData.name} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Company</Label>
          <Input 
            placeholder="e.g. Acme Corp"
            value={formData.companyName} 
            onChange={e => setFormData({ ...formData, companyName: e.target.value })} 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Budget (USD)</Label>
          <Input 
            type="number"
            value={formData.budget} 
            onChange={e => setFormData({ ...formData, budget: e.target.value })} 
          />
        </div>

        <div className="space-y-2">
          <Label>Project Type</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="solution">Solution Delivery</option>
            <option value="product">Product Development</option>
            <option value="internal">Internal</option>
          </select>
        </div>

        <div className="space-y-2 flex flex-col">
          <Label>Accountable Person (Owner)</Label>
          <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={ownerOpen}
                className={cn(
                  "justify-between font-normal",
                  !formData.ownerId && "text-muted-foreground"
                )}
              >
                {formData.ownerId
                  ? `${employees.find((emp) => emp.id === formData.ownerId)?.firstName || ''} ${employees.find((emp) => emp.id === formData.ownerId)?.lastName || ''}`
                  : "Select an owner..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search owner..."
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto p-1">
                {employees
                  .filter(emp => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(ownerSearch.toLowerCase()))
                  .map(emp => (
                    <div
                      key={emp.id}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        setFormData({ ...formData, ownerId: emp.id });
                        setOwnerOpen(false);
                        setOwnerSearch('');
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.ownerId === emp.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {emp.firstName} {emp.lastName}
                    </div>
                  ))}
                {employees.filter(emp => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(ownerSearch.toLowerCase())).length === 0 && (
                  <div className="py-6 text-center text-sm">No owner found.</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 flex flex-col">
          <Label>Developers</Label>
          <Popover open={developersOpen} onOpenChange={setDevelopersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={developersOpen}
                className={cn(
                  "justify-between font-normal",
                  teamMembers.length === 0 && "text-muted-foreground"
                )}
              >
                {teamMembers.length > 0
                  ? `${teamMembers.length} developer(s) selected`
                  : "Select developers..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search developer..."
                  value={developerSearch}
                  onChange={(e) => setDeveloperSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto p-1">
                {(() => {
                  const filteredEmps = employees.filter(emp => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(developerSearch.toLowerCase()));
                  if (filteredEmps.length === 0) {
                    return <div className="py-6 text-center text-sm">No developer found.</div>;
                  }

                  return ROLES.map(group => (
                    <div key={group}>
                      <div 
                        className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/10 flex justify-between items-center cursor-pointer hover:bg-muted/30"
                        onClick={(e) => {
                          e.preventDefault();
                          setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
                        }}
                      >
                        {group}
                        {expandedGroups[group] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </div>
                      {expandedGroups[group] && filteredEmps.map(emp => (
                        <div
                          key={emp.id}
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTeamMembers(prev => {
                              const existingIndex = prev.findIndex(m => m.id === emp.id && m.role === group);
                              if (existingIndex >= 0) {
                                return prev.filter((_, i) => i !== existingIndex);
                              }
                              return [...prev, { id: emp.id, role: group }];
                            });
                          }}
                        >
                          <Checkbox
                            className="mr-2 pointer-events-none"
                            checked={teamMembers.some(m => m.id === emp.id && m.role === group)}
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
            <div className="flex flex-col gap-2 mt-3 bg-muted/20 p-2 rounded-md border">
              {teamMembers.map(member => {
                const emp = employees.find(e => e.id === member.id);
                if (!emp) return null;
                return (
                  <div key={`${member.id}-${member.role}`} className="flex items-center justify-between bg-background border px-3 py-2 rounded-md shadow-sm">
                    <span className="text-sm font-medium">{emp.firstName} {emp.lastName}</span>
                    <div className="flex items-center gap-3">
                      <select 
                        className="h-8 text-xs rounded-md border border-input bg-transparent px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                        value={member.role}
                        onChange={(e) => setTeamMembers(prev => prev.map(m => (m.id === member.id && m.role === member.role) ? { ...m, role: e.target.value } : m))}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setTeamMembers(prev => prev.filter(m => !(m.id === member.id && m.role === member.role)))} 
                        className="text-muted-foreground hover:text-destructive flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input 
              type="date"
              value={formData.startDate} 
              onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input 
              type="date"
              value={formData.endDate} 
              onChange={e => setFormData({ ...formData, endDate: e.target.value })} 
            />
          </div>
        </div>
      </form>

      <div className="pt-6 mt-2 border-t bg-background flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button form="project-form" type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </div>
  );
}

