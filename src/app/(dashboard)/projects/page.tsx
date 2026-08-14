import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProjectsTable } from '@/components/projects/projects-table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ProjectForm } from '@/components/projects/project-form';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage your projects and tasks',
};

export default function ProjectsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <PageHeader 
        pretitle="Projects"
        title="Projects Overview"
        description="Manage your projects, track tasks, and collaborate with your team."
        actions={
          <Sheet>
            <SheetTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold transition-all hover:scale-105">
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[480px] overflow-hidden flex flex-col p-0">
              <SheetHeader className="px-6 py-6 border-b shrink-0">
                <SheetTitle className="text-2xl font-bold font-heading">Create New Project</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 relative h-full">
                <div className="py-6 min-h-full pb-20">
                  <ProjectForm />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        }
      />
      
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            A list of all active and past projects you have access to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectsTable />
        </CardContent>
      </Card>
    </div>
  );
}
