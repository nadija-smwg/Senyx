export const dynamic = 'force-dynamic';
import { PageHeader } from '../../../components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import Link from 'next/link';
import { Shield, Settings } from 'lucide-react';

export default function SettingsOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage platform configurations and access controls." />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/settings/roles">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <Shield className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Manage user roles and define access control matrices.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/settings/general">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <Settings className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Company information, regional settings, and defaults.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
