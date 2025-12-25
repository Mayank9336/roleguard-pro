import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRBAC, Role } from '@/hooks/useRBAC';
import { Search, Users, Key, Loader2 } from 'lucide-react';

export default function Assignments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    roles,
    permissions,
    loading,
    getPermissionsForRole,
    assignPermissionToRole,
    removePermissionFromRole,
  } = useRBAC();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [permSearch, setPermSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
    }
  }, [roles, selectedRole]);

  if (authLoading || !user) {
    return null;
  }

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const filteredPermissions = permissions.filter((p) =>
    p.name.toLowerCase().includes(permSearch.toLowerCase())
  );

  const rolePermissions = selectedRole ? getPermissionsForRole(selectedRole.id) : [];
  const rolePermissionIds = new Set(rolePermissions.map((p) => p.id));

  const handleTogglePermission = async (permissionId: string) => {
    if (!selectedRole || processing) return;

    setProcessing(permissionId);
    try {
      if (rolePermissionIds.has(permissionId)) {
        await removePermissionFromRole(selectedRole.id, permissionId);
      } else {
        await assignPermissionToRole(selectedRole.id, permissionId);
      }
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Permission Assignments"
        description="Assign permissions to roles to control access in your application"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role Selection */}
        <Card className="lg:col-span-1 animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No roles found
                  </p>
                ) : (
                  filteredRoles.map((role) => {
                    const permCount = getPermissionsForRole(role.id).length;
                    const isSelected = selectedRole?.id === role.id;
                    return (
                      <Button
                        key={role.id}
                        variant={isSelected ? 'secondary' : 'ghost'}
                        className={`w-full justify-between ${isSelected ? 'bg-accent' : ''}`}
                        onClick={() => setSelectedRole(role)}
                      >
                        <span className="truncate">{role.name}</span>
                        <Badge variant={permCount > 0 ? 'default' : 'outline'} className="ml-2">
                          {permCount}
                        </Badge>
                      </Button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Permission Assignment */}
        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              {selectedRole ? (
                <>
                  Permissions for <span className="text-primary">{selectedRole.name}</span>
                </>
              ) : (
                'Select a role'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a role to manage its permissions</p>
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredPermissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No permissions found
                      </p>
                    ) : (
                      filteredPermissions.map((permission) => {
                        const isAssigned = rolePermissionIds.has(permission.id);
                        const isProcessing = processing === permission.id;
                        return (
                          <div
                            key={permission.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              isAssigned
                                ? 'bg-accent/50 border-primary/30'
                                : 'bg-card border-border hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              id={permission.id}
                              checked={isAssigned}
                              disabled={isProcessing}
                              onCheckedChange={() => handleTogglePermission(permission.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={permission.id}
                                className="block font-mono text-sm font-medium cursor-pointer"
                              >
                                {permission.name}
                              </label>
                              {permission.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                            {isProcessing && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {rolePermissions.length} of {permissions.length} permissions assigned
                  </p>
                  <Badge variant="secondary">
                    {Math.round((rolePermissions.length / (permissions.length || 1)) * 100)}% coverage
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
