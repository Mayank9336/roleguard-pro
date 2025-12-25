import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export function useRBAC() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [permRes, roleRes, rpRes] = await Promise.all([
        supabase.from('permissions').select('*').order('name'),
        supabase.from('roles').select('*').order('name'),
        supabase.from('role_permissions').select('*'),
      ]);

      if (permRes.error) throw permRes.error;
      if (roleRes.error) throw roleRes.error;
      if (rpRes.error) throw rpRes.error;

      setPermissions(permRes.data || []);
      setRoles(roleRes.data || []);
      setRolePermissions(rpRes.data || []);
    } catch (error) {
      console.error('Error fetching RBAC data:', error);
      toast({
        title: 'Error loading data',
        description: 'Could not load roles and permissions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Permission CRUD
  const createPermission = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('permissions')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error creating permission',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    setPermissions((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: 'Permission created', description: `"${name}" has been created.` });
    return data;
  };

  const updatePermission = async (id: string, name: string, description?: string) => {
    const { data, error } = await supabase
      .from('permissions')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error updating permission',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? data : p)).sort((a, b) => a.name.localeCompare(b.name))
    );
    toast({ title: 'Permission updated', description: `"${name}" has been updated.` });
    return data;
  };

  const deletePermission = async (id: string) => {
    const permission = permissions.find((p) => p.id === id);
    const { error } = await supabase.from('permissions').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting permission',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    setPermissions((prev) => prev.filter((p) => p.id !== id));
    setRolePermissions((prev) => prev.filter((rp) => rp.permission_id !== id));
    toast({ title: 'Permission deleted', description: `"${permission?.name}" has been deleted.` });
    return true;
  };

  // Role CRUD
  const createRole = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('roles')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error creating role',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    setRoles((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: 'Role created', description: `"${name}" has been created.` });
    return data;
  };

  const updateRole = async (id: string, name: string, description?: string) => {
    const { data, error } = await supabase
      .from('roles')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error updating role',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    setRoles((prev) =>
      prev.map((r) => (r.id === id ? data : r)).sort((a, b) => a.name.localeCompare(b.name))
    );
    toast({ title: 'Role updated', description: `"${name}" has been updated.` });
    return data;
  };

  const deleteRole = async (id: string) => {
    const role = roles.find((r) => r.id === id);
    const { error } = await supabase.from('roles').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting role',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    setRoles((prev) => prev.filter((r) => r.id !== id));
    setRolePermissions((prev) => prev.filter((rp) => rp.role_id !== id));
    toast({ title: 'Role deleted', description: `"${role?.name}" has been deleted.` });
    return true;
  };

  // Role-Permission linking
  const assignPermissionToRole = async (roleId: string, permissionId: string) => {
    const { data, error } = await supabase
      .from('role_permissions')
      .insert({ role_id: roleId, permission_id: permissionId })
      .select()
      .single();

    if (error) {
      if (error.message.includes('duplicate')) {
        toast({
          title: 'Already assigned',
          description: 'This permission is already assigned to the role.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error assigning permission',
          description: error.message,
          variant: 'destructive',
        });
      }
      return null;
    }

    setRolePermissions((prev) => [...prev, data]);
    
    const role = roles.find((r) => r.id === roleId);
    const permission = permissions.find((p) => p.id === permissionId);
    toast({
      title: 'Permission assigned',
      description: `"${permission?.name}" assigned to "${role?.name}".`,
    });
    return data;
  };

  const removePermissionFromRole = async (roleId: string, permissionId: string) => {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);

    if (error) {
      toast({
        title: 'Error removing permission',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    setRolePermissions((prev) =>
      prev.filter((rp) => !(rp.role_id === roleId && rp.permission_id === permissionId))
    );

    const role = roles.find((r) => r.id === roleId);
    const permission = permissions.find((p) => p.id === permissionId);
    toast({
      title: 'Permission removed',
      description: `"${permission?.name}" removed from "${role?.name}".`,
    });
    return true;
  };

  const getPermissionsForRole = (roleId: string) => {
    const permissionIds = rolePermissions
      .filter((rp) => rp.role_id === roleId)
      .map((rp) => rp.permission_id);
    return permissions.filter((p) => permissionIds.includes(p.id));
  };

  const getRolesForPermission = (permissionId: string) => {
    const roleIds = rolePermissions
      .filter((rp) => rp.permission_id === permissionId)
      .map((rp) => rp.role_id);
    return roles.filter((r) => roleIds.includes(r.id));
  };

  return {
    permissions,
    roles,
    rolePermissions,
    loading,
    refresh: fetchData,
    // Permission operations
    createPermission,
    updatePermission,
    deletePermission,
    // Role operations
    createRole,
    updateRole,
    deleteRole,
    // Role-Permission operations
    assignPermissionToRole,
    removePermissionFromRole,
    getPermissionsForRole,
    getRolesForPermission,
  };
}
