'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { Loader2, Briefcase, Calendar, DollarSign, Users, Building, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProjectOverviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [expandedRoles, setExpandedRoles] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, accRes, empRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch('/api/accounts'),
          fetch('/api/employees?minimal=true')
        ]);
        const projData = await projRes.json();
        const accData = await accRes.json();
        const empData = await empRes.json();
        
        setData({
          project: projData.data,
          accounts: accData.data || [],
          employees: empData.data || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!data || !data.project) {
    return <div>Failed to load project details.</div>;
  }

  const { project, accounts, employees } = data;

  const formatCurrency = (val: number, currency = 'USD') => {
    if (!val) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const getAccountName = (accId: string) => {
    if (!accId) return 'None';
    return accounts.find((a: any) => a.id === accId)?.name || 'Unknown Account';
  };

  const getEmployeeName = (empId: string) => {
    if (!empId) return 'Unassigned';
    const emp = employees.find((e: any) => e.id === empId);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground">Project Name</div>
              <div className="col-span-2 font-medium">{project.name}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Building className="h-4 w-4" /> Company
              </div>
              <div className="col-span-2">{project.companyName || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Building className="h-4 w-4" /> Account
              </div>
              <div className="col-span-2">{getAccountName(project.accountId)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Tag className="h-4 w-4" /> Project Type
              </div>
              <div className="col-span-2 capitalize">{project.type}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Budget
              </div>
              <div className="col-span-2">{formatCurrency(project.budget, project.currency)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Start Date
              </div>
              <div className="col-span-2">{formatDate(project.startDate)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> End Date
              </div>
              <div className="col-span-2">{formatDate(project.endDate)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team & Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Accountable Person</h4>
              <div className="flex items-center p-3 bg-muted/30 rounded-lg border">
                <div className="font-medium">{getEmployeeName(project.ownerId)}</div>
                <Badge variant="outline" className="ml-auto">Owner</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Developers & Team</h4>
              {project.assignments && project.assignments.filter((a: any) => a.roleOnProject !== 'Project Owner').length > 0 ? (
                <div className="space-y-2">
                  {(() => {
                    const devAssignments = project.assignments.filter((a: any) => a.roleOnProject !== 'Project Owner');
                    const grouped = devAssignments.reduce((acc: any, a: any) => {
                      const role = a.roleOnProject || 'Other';
                      if (!acc[role]) acc[role] = [];
                      acc[role].push(a);
                      return acc;
                    }, {});

                    return Object.keys(grouped).map(role => (
                      <div key={role} className="border rounded-md overflow-hidden">
                        <div 
                          className="px-3 py-2 bg-muted/30 text-sm font-medium flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedRoles(prev => ({ ...prev, [role]: !prev[role] }))}
                        >
                          <span className="uppercase tracking-wider text-xs">{role}</span>
                          {expandedRoles[role] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        {expandedRoles[role] && (
                          <div className="p-2 space-y-2 bg-background border-t">
                            {grouped[role].map((assignment: any) => (
                              <div key={assignment.id} className="flex items-center justify-between p-2 bg-muted/10 rounded-md">
                                <div className="text-sm font-medium">{getEmployeeName(assignment.employeeId)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No team members assigned.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
