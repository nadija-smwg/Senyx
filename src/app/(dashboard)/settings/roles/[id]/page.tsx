'use client';
import { PageHeader } from '../../../../../components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { use } from 'react';

export default function RoleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Using React.use to unwrap params
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader title="Role Details" description={`Manage permissions for role ${id}`}>
        <Button>Save Changes</Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Permission toggles will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
