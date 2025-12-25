import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { FormDialog } from '@/components/common/FormDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useRBAC, Permission } from '@/hooks/useRBAC';
import { Plus, Pencil, Trash2, Search, Key } from 'lucide-react';
import { format } from 'date-fns';

export default function Permissions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    permissions,
    loading,
    createPermission,
    updatePermission,
    deletePermission,
    getRolesForPermission,
  } = useRBAC();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const filteredPermissions = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setSelectedPermission(null);
    setFormData({ name: '', description: '' });
    setFormOpen(true);
  };

  const handleOpenEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({ name: permission.name, description: permission.description || '' });
    setFormOpen(true);
  };

  const handleOpenDelete = (permission: Permission) => {
    setSelectedPermission(permission);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (selectedPermission) {
        await updatePermission(selectedPermission.id, formData.name.trim(), formData.description.trim() || undefined);
      } else {
        await createPermission(formData.name.trim(), formData.description.trim() || undefined);
      }
      setFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;
    await deletePermission(selectedPermission.id);
    setDeleteOpen(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Permission Name',
      render: (permission: Permission) => (
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <code className="font-mono text-sm">{permission.name}</code>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (permission: Permission) => (
        <span className="text-muted-foreground">{permission.description || '—'}</span>
      ),
    },
    {
      key: 'roles',
      header: 'Used By',
      render: (permission: Permission) => {
        const roles = getRolesForPermission(permission.id);
        return roles.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {roles.slice(0, 2).map((role) => (
              <Badge key={role.id} variant="secondary">
                {role.name}
              </Badge>
            ))}
            {roles.length > 2 && (
              <Badge variant="outline">+{roles.length - 2}</Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not assigned</span>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (permission: Permission) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(permission.created_at), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      render: (permission: Permission) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(permission)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDelete(permission)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Permissions"
        description="Manage individual access permissions for your application"
        action={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Permission
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredPermissions}
        loading={loading}
        emptyMessage="No permissions found. Create your first permission to get started."
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selectedPermission ? 'Edit Permission' : 'Create Permission'}
        description={
          selectedPermission
            ? 'Update the permission details below'
            : 'Add a new permission to your access control system'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Permission Name</Label>
            <Input
              id="name"
              placeholder="e.g., can_edit_articles"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">Use snake_case for consistency</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this permission"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !formData.name.trim()}>
              {submitting ? 'Saving...' : selectedPermission ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Permission"
        description={`Are you sure you want to delete "${selectedPermission?.name}"? This will also remove it from all assigned roles. This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </DashboardLayout>
  );
}
