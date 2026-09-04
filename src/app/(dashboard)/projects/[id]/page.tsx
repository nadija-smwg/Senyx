'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  Tag,
  Users,
} from 'lucide-react';
import {
  CrmSection,
  CrmErrorState,
  CrmLoadingState,
} from '@/components/crm/crm-shell';
import {
  ProjectAvatar,
  ProjectDetailRow,
  ProjectStatusBadge,
  ProjectTypeBadge,
  ProjectBillingBadge,
  ProjectProgressBar,
  computeProgress,
  formatProjectDateRange,
} from '@/components/projects/project-shell';
import { CurrencyDisplay } from '@/components/ui/currency-display';

type Project = {
  id: string;
  name: string;
  code: string;
  type?: string | null;
  status: string;
  companyName?: string | null;
  accountId?: string | null;
  ownerId?: string | null;
  billingType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: string | number | null;
  currency?: string | null;
  assignments?: Array<{
    id: string;
    employeeId: string;
    roleOnProject?: string | null;
    allocationPct?: string | number | null;
  }>;
  milestones?: Array<{ id: string; name: string; status: string; dueDate?: string | null }>;
  paymentMilestones?: Array<{ id: string; name: string; status: string; amount?: string | number | null }>;
};

type Account = { id: string; name: string };
type Employee = { id: string; firstName: string; lastName?: string | null };

export default function ProjectOverviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = React.useState<{
    project: Project;
    accounts: Account[];
    employees: Employee[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, accRes, empRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch('/api/accounts'),
          fetch('/api/employees?minimal=true'),
        ]);
        if (!projRes.ok) throw new Error('Failed to load project');
        const projData = await projRes.json();
        const accData = await accRes.json();
        const empData = await empRes.json();

        setData({
          project: projData.data,
          accounts: accData.data || [],
          employees: empData.data || [],
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <CrmLoadingState label="Loading project…" />;
  if (error)
    return <CrmErrorState title="Couldn't load project" message={error} onRetry={() => window.location.reload()} />;
  if (!data || !data.project) {
    return <CrmErrorState title="Project not found" message="The requested project could not be loaded." />;
  }

  const { project, accounts, employees } = data;

  const accountName = (accId?: string | null) =>
    accId ? accounts.find(a => a.id === accId)?.name || 'Unknown account' : '—';

  const employeeName = (empId?: string | null) => {
    if (!empId) return 'Unassigned';
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.firstName}${emp.lastName ? ' ' + emp.lastName : ''}` : 'Unknown';
  };

  type Assignment = NonNullable<Project['assignments']>[number];
  const allAssignments: Assignment[] = project.assignments || [];
  const ownerAssignments = allAssignments.filter(a => a.roleOnProject === 'Project Owner');
  const teamAssignments = allAssignments.filter(a => a.roleOnProject !== 'Project Owner');

  // Group team by role
  const groupedTeam = teamAssignments.reduce<Record<string, Assignment[]>>((acc, a) => {
    const role = a.roleOnProject || 'Team Member';
    if (!acc[role]) acc[role] = [];
    acc[role].push(a);
    return acc;
  }, {});

  const progress = computeProgress(project.startDate, project.endDate);
  const overdue = progress !== null && progress >= 100 && project.status !== 'completed' && project.status !== 'cancelled';

  const milestonesTotal = project.milestones?.length || 0;
  const milestonesDone = (project.milestones || []).filter(m => m.status === 'completed').length;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left column: details + summary */}
      <div className="lg:col-span-2 space-y-4">
        <CrmSection
          title="Project Details"
          description="Core metadata, schedule and budget."
          actions={<ProjectStatusBadge status={project.status} />}
        >
          <div className="divide-y divide-gray-100">
            <ProjectDetailRow label="Project Name" icon={<Briefcase className="w-3.5 h-3.5" />}>
              <span className="font-semibold">{project.name}</span>
              <span className="ml-2 text-[11px] font-mono text-gray-400">{project.code}</span>
            </ProjectDetailRow>
            <ProjectDetailRow label="Type" icon={<Tag className="w-3.5 h-3.5" />}>
              <ProjectTypeBadge type={project.type} />
              <ProjectBillingBadge billingType={project.billingType} className="ml-1.5" />
            </ProjectDetailRow>
            <ProjectDetailRow label="Company" icon={<Building className="w-3.5 h-3.5" />}>
              {project.companyName || <span className="text-gray-400">—</span>}
            </ProjectDetailRow>
            <ProjectDetailRow label="Account" icon={<Building className="w-3.5 h-3.5" />}>
              {accountName(project.accountId)}
            </ProjectDetailRow>
            <ProjectDetailRow label="Schedule" icon={<Calendar className="w-3.5 h-3.5" />}>
              {formatProjectDateRange(project.startDate, project.endDate)}
            </ProjectDetailRow>
            <ProjectDetailRow label="Budget" icon={<DollarSign className="w-3.5 h-3.5" />}>
              {project.budget ? (
                <CurrencyDisplay amount={parseFloat(String(project.budget)) || 0} className="!text-[15px]" />
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </ProjectDetailRow>
          </div>

          {/* Progress */}
          {progress !== null && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Time elapsed</p>
                <span
                  className={
                    'text-xs font-semibold tabular-nums ' +
                    (overdue ? 'text-rose-600' : 'text-gray-700')
                  }
                >
                  {progress}% {overdue ? '· overdue' : ''}
                </span>
              </div>
              <ProjectProgressBar percent={progress} status={project.status} />
            </div>
          )}
        </CrmSection>

        {/* Milestones summary */}
        {milestonesTotal > 0 && (
          <CrmSection title="Milestones" description="Delivery checkpoints for this project.">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.round((milestonesDone / milestonesTotal) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-xs font-semibold tabular-nums text-gray-700">
                {milestonesDone} / {milestonesTotal} done
              </div>
            </div>
          </CrmSection>
        )}
      </div>

      {/* Right column: team */}
      <div className="space-y-4">
        <CrmSection
          title="Accountable Person"
          description="The single point of ownership for this project."
        >
          {ownerAssignments.length > 0 ? (
            <div className="flex items-center gap-3">
              <ProjectAvatar name={employeeName(ownerAssignments[0]!.employeeId)} className="h-9 w-9" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {employeeName(ownerAssignments[0]!.employeeId)}
                </p>
                <p className="text-[11px] text-gray-500 truncate">Project Owner</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ProjectAvatar name={employeeName(project.ownerId)} className="h-9 w-9" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {employeeName(project.ownerId)}
                </p>
                <p className="text-[11px] text-gray-500 truncate">Owner</p>
              </div>
            </div>
          )}
        </CrmSection>

        <CrmSection
          title="Team & Assignments"
          description={`${teamAssignments.length} active member${teamAssignments.length === 1 ? '' : 's'}`}
        >
          {teamAssignments.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4 text-gray-400" />
              No team members assigned.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedTeam).map(([role, members]) => (
                <div key={role}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-1.5">
                    {role} <span className="text-gray-400">({members.length})</span>
                  </p>
                  <ul className="space-y-1.5">
                    {members.map(m => (
                      <li
                        key={m.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/40 px-2.5 py-2"
                      >
                        <ProjectAvatar name={employeeName(m.employeeId)} className="h-6 w-6" />
                        <span className="text-sm text-gray-800 truncate flex-1">
                          {employeeName(m.employeeId)}
                        </span>
                        {m.allocationPct && (
                          <span className="text-[10px] tabular-nums text-gray-500 font-semibold">
                            {String(m.allocationPct)}%
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CrmSection>
      </div>
    </div>
  );
}
