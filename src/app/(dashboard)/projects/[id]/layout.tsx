import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Kanban, ListTodo, Users, Flag, DollarSign, Clock, AlertTriangle, FileText } from 'lucide-react';
import { db } from '@/server/db/client';
import { projects } from '@/server/db/schema/projects';
import { eq } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Project Detail',
};

async function getProject(id: string) {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  } catch (e) {
    return null;
  }
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const project = await getProject(resolvedParams.id);

  if (!project) {
    notFound();
  }

  const navItems = [
    { name: 'Overview', href: `/projects/${project.id}`, icon: LayoutDashboard },
    { name: 'Board', href: `/projects/${project.id}/board`, icon: Kanban },
    { name: 'Tasks', href: `/projects/${project.id}/tasks`, icon: ListTodo },
    { name: 'Team', href: `/projects/${project.id}/team`, icon: Users },
    { name: 'Milestones', href: `/projects/${project.id}/milestones`, icon: Flag },
    { name: 'Payments', href: `/projects/${project.id}/payments`, icon: DollarSign },
    { name: 'Time', href: `/projects/${project.id}/time`, icon: Clock },
    { name: 'Risks', href: `/projects/${project.id}/risks`, icon: AlertTriangle },
    { name: 'Documents', href: `/projects/${project.id}/documents`, icon: FileText },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
            <Badge variant="outline">{project.code}</Badge>
            <Badge className="capitalize">{project.status.replace('_', ' ')}</Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Edit Project</Button>
          <Button>Clock In</Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
        <div className="flex space-x-1 pb-px">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`flex items-center gap-2 rounded-none border-b-2 px-4 py-2 font-medium ${
                  // Assuming current path matching logic is simple for now
                  // This is a naive active state match. We'd use usePathname in a client component for real active state.
                  // For RSC layout, we can pass it down or let a client-side wrapper handle it.
                  'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
