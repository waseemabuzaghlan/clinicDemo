'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, Pencil, Trash, Plus, Users, Search, ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { exportToExcel } from '@/lib/export-utils';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface ValidationErrors {
  name?: string[];
  description?: string[];
}

interface SortConfig {
  key: 'name' | 'description';
  direction: 'asc' | 'desc' | null;
}

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editValidationErrors, setEditValidationErrors] = useState<ValidationErrors>({});
  const itemsPerPage = 5;
  const { toast } = useToast();
  
  const tableHeader = (
    <TableRow className="bg-muted/50">
      <TableHead>
        <Button
          variant="ghost"
          onClick={() => handleSort('name')}
          className="hover:bg-transparent flex items-center gap-2 -ml-4"
        >
          Role Name
        </Button>
      </TableHead>
      <TableHead>
        <Button
          variant="ghost"
          onClick={() => handleSort('description')}
          className="hover:bg-transparent flex items-center gap-2 -ml-4"
        >
          Description
        </Button>
      </TableHead>
      <TableHead className="w-[100px] text-right">Actions</TableHead>
    </TableRow>
  );

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
   
    try {
      const response = await fetch('/api/roles', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        console.error('Invalid data format:', data);
        toast({
          title: "Data format error",
          description: "Received invalid data format from the server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error fetching roles",
        description: error instanceof Error ? error.message : "Failed to load roles",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  }

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key
        ? current.direction === 'asc'
          ? 'desc'
          : current.direction === 'desc'
            ? null
            : 'asc'
        : 'asc'
    }));
    setCurrentPage(1);
  };
  const handleExport = () => {
    const dataToExport = roles.map(role => ({
      'Role Name': role.name,
      'Description': role.description || 'No description'
    }));

    exportToExcel(dataToExport, 'Roles');
    
    toast({
      title: "Export Successful",
      description: "Roles data has been exported to Excel",
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});
        
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newRole.name.trim(),
          description: newRole.description.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          setValidationErrors(data.errors);
          return; 
        }
        throw new Error(data?.title || data?.message || 'Failed to create role');
      }

      await fetchRoles();
      setIsOpen(false);
      setNewRole({ name: '', description: '' });
      setValidationErrors({});
      
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error creating role",
        description: error instanceof Error ? error.message : "Failed to create role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;  
    
    setIsLoading(true);
    setEditValidationErrors({});

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: selectedRole.name.trim(),
          description: selectedRole.description?.trim() || null
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 400 && data?.errors) {
          setEditValidationErrors(data.errors);
          return;
        }
        throw new Error(data?.title || data?.message || 'Failed to update role');
      }

      await fetchRoles();
      setIsEditOpen(false);
      setSelectedRole(null);
      setEditValidationErrors({});
      
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 204 || response.ok) {
        await fetchRoles();
        setIsDeleteOpen(false);
        setSelectedRole(null);
        
        toast({
          title: "Success",
          description: "Role deleted successfully",
        });
        return;
      }

      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error deleting role",
        description: error instanceof Error ? error.message : "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteOpen(false);
    }
  }

  const getRoleBadgeColor = useMemo(() => {
    const count = roles.length;
    if (count <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (count <= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }, [roles.length]);

  // Update the filtering and sorting logic
  let filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [roles, searchQuery]);

  // Update sorting logic
  filteredRoles = useMemo(() => {
    if (!sortConfig.direction) return filteredRoles;

    return [...filteredRoles].sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const descA = a.description || '';
        const descB = b.description || '';
        return sortConfig.direction === 'asc'
          ? descA.localeCompare(descB)
          : descB.localeCompare(descA);
      }
    });
  }, [filteredRoles, sortConfig]);

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + itemsPerPage);

  const content = isInitialLoading ? (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-lg font-medium">Loading roles...</span>
      </div>
    </div>
  ) : (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Role Management</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage and organize user roles within the system
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setValidationErrors({});
              setNewRole({ name: '', description: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg hover:shadow-md transition-all" size="lg">
                <Plus className="h-5 w-5" />
                Add New Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Add a new role to manage user permissions and access levels.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    required
                    disabled={isLoading}
                    placeholder="Enter role name"
                    className={`mt-1.5 focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300 ${validationErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {validationErrors.name && (
                    <p className="mt-2 text-sm text-red-500">
                      {validationErrors.name[0]}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    disabled={isLoading}
                    placeholder="Enter role description"
                    className={`mt-1.5 focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300 ${validationErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {validationErrors.description && (
                    <p className="mt-2 text-sm text-red-500">
                      {validationErrors.description[0]}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full shadow-lg hover:shadow-md transition-all" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Role'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
            />
          </div>
          <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg shadow-sm ${getRoleBadgeColor}`}>
            <Users className="h-4 w-4" />
            <span>{roles.length} roles</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
        <Table>
          <TableHeader>
            {tableHeader}
          </TableHeader>
          <TableBody>
            {paginatedRoles.map((role) => (
              <TableRow key={role.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium text-base">{role.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {role.description || 'No description'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-lg"
                      onClick={() => {
                        setSelectedRole(role);
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                      onClick={() => {
                        setSelectedRole(role);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredRoles.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">
                      {searchQuery ? 'No roles found matching your search' : 'No roles found'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating a new role'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filteredRoles.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog 
        open={isEditOpen} 
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditValidationErrors({});
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the role name and description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={selectedRole?.name || ''}
                onChange={(e) => setSelectedRole(selectedRole ? { ...selectedRole, name: e.target.value } : null)}
                required
                disabled={isLoading}
                placeholder="Enter role name"
                className={`mt-1.5 focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300 ${editValidationErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {editValidationErrors.name && (
                <p className="mt-2 text-sm text-red-500">
                  {editValidationErrors.name[0]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={selectedRole?.description || ''}
                onChange={(e) => setSelectedRole(selectedRole ? { ...selectedRole, description: e.target.value } : null)}
                disabled={isLoading}
                placeholder="Enter role description"
                className={`mt-1.5 focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300 ${editValidationErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {editValidationErrors.description && (
                <p className="mt-2 text-sm text-red-500">
                  {editValidationErrors.description[0]}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full shadow-lg hover:shadow-md transition-all" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role
              "{selectedRole?.name}" and may affect users assigned to this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 transition-colors shadow-lg hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main>{content}</main>
      </div>
    </div>
  );
}

export default RolesPage;