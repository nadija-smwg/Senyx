'use client';
import { useState, useEffect } from 'react';
import { PageHeader } from '../../../../components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Spinner } from '../../../../components/ui/spinner';
import { fetchClient } from '../../../../lib/api-client';
import Link from 'next/link';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export default function RolesListPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClient<{ data: Role[] }>('/api/roles')
      .then(res => setRoles(res.data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Roles & Permissions" description="View and manage system roles.">
        <Button onClick={() => toast('Role creation not implemented yet')}>Create Role</Button>
      </PageHeader>
      
      {isLoading ? (
        <Spinner className="mx-auto mt-10 w-8 h-8" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map(role => (
            <Card key={role.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{role.name}</CardTitle>
                {role.isSystem && <Badge variant="secondary">System Role</Badge>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{role.description || 'No description provided.'}</p>
                <div className="flex justify-end">
                  <Link href={`/settings/roles/${role.id}`}>
                    <Button variant="outline" size="sm">Edit Permissions</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
