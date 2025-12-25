import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRBAC } from '@/hooks/useRBAC';
import { Key, Users, Link2, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { permissions, roles, rolePermissions, loading } = useRBAC();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const stats = [
    {
      title: 'Total Permissions',
      value: permissions.length,
      description: 'Defined access controls',
      icon: Key,
    },
    {
      title: 'Total Roles',
      value: roles.length,
      description: 'User role templates',
      icon: Users,
    },
    {
      title: 'Assignments',
      value: rolePermissions.length,
      description: 'Role-permission links',
      icon: Link2,
    },
    {
      title: 'Coverage',
      value: `${roles.length > 0 ? Math.round((rolePermissions.length / (roles.length * permissions.length || 1)) * 100) : 0}%`,
      description: 'Assignment density',
      icon: Shield,
    },
  ];

  const recentPermissions = permissions.slice(0, 5);
  const recentRoles = roles.slice(0, 5);

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your role-based access control configuration"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <div key={stat.title} style={{ animationDelay: `${index * 100}ms` }}>
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ) : (
              <StatCard {...stat} />
            )}
          </div>
        ))}
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Permissions */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Recent Permissions</CardTitle>
            <Link to="/permissions">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : recentPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions created yet.</p>
            ) : (
              <div className="space-y-2">
                {recentPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <code className="text-sm font-mono">{permission.name}</code>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Roles */}
        <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Recent Roles</CardTitle>
            <Link to="/roles">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : recentRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles created yet.</p>
            ) : (
              <div className="space-y-2">
                {recentRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm font-medium">{role.name}</span>
                    <Badge variant="secondary">
                      {rolePermissions.filter((rp) => rp.role_id === role.id).length} perms
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/permissions" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Key className="h-4 w-4" />
                Manage Permissions
              </Button>
            </Link>
            <Link to="/roles" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Manage Roles
              </Button>
            </Link>
            <Link to="/assignments" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Link2 className="h-4 w-4" />
                Assign Permissions
              </Button>
            </Link>
            <Link to="/ai" className="block">
              <Button variant="default" className="w-full justify-start gap-2">
                <Shield className="h-4 w-4" />
                AI Assistant
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
