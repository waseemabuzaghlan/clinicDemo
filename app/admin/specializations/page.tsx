'use client';

import React, { useState, useEffect } from 'react';
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
import { 
  Stethoscope, 
  Loader2, 
  Pencil, 
  Trash, 
  Plus, 
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  RefreshCw
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

interface Specialization {
  id: string;
  name: string;
  description: string;
}

interface ValidationErrors {
  name?: string[];
  description?: string[];
}

type SortDirection = 'asc' | 'desc' | null;

const SpecializationsPage: React.FC = () => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<Specialization | null>(null);
  const [newSpecialization, setNewSpecialization] = useState({ name: '', description: '' });
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'description'>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const itemsPerPage = 5;
  const { toast } = useToast();

  useEffect(() => {
    fetchSpecializations();
  }, []);

  async function fetchSpecializations() {
    try {
      const response = await fetch('/api/doctor-specialization', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to load specializations');
      }

      const data = await response.json();
      setSpecializations(data);
    } catch (error) {
      console.error('Error fetching specializations:', error);
      toast({
        title: "Error fetching specializations",
        description: error instanceof Error ? error.message : "Failed to load specializations",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSpecializations();
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    try {
      const response = await fetch('/api/doctor-specialization', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newSpecialization.name.trim(),
          description: newSpecialization.description.trim()
        }),
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          setValidationErrors(data.errors);
          throw new Error('Please fix the validation errors');
        }
        throw new Error(data.message || 'Failed to create specialization');
      }

      await fetchSpecializations();
      setIsOpen(false);
      setNewSpecialization({ name: '', description: '' });
      setValidationErrors({});
      
      toast({
        title: "Success",
        description: "Specialization created successfully",
      });
    } catch (error) {
      console.error('Error creating specialization:', error);
      if (!(error instanceof Error && error.message === 'Please fix the validation errors')) {
        toast({
          title: "Error creating specialization",
          description: error instanceof Error ? error.message : "Failed to create specialization",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSpecialization) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/doctor-specialization/${selectedSpecialization.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: selectedSpecialization.name.trim(),
          description: selectedSpecialization.description.trim()
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update specialization');
      }

      await fetchSpecializations();
      setIsEditOpen(false);
      setSelectedSpecialization(null);
      toast({
        title: "Success",
        description: "Specialization updated successfully",
      });
    } catch (error) {
      console.error('Error updating specialization:', error);
      toast({
        title: "Error updating specialization",
        description: error instanceof Error ? error.message : "Failed to update specialization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedSpecialization) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/doctor-specialization/${selectedSpecialization.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete specialization');
      }

      await fetchSpecializations();
      setIsDeleteOpen(false);
      setSelectedSpecialization(null);
      toast({
        title: "Success",
        description: "Specialization deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting specialization:', error);
      toast({
        title: "Error deleting specialization",
        description: error instanceof Error ? error.message : "Failed to delete specialization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSort = (field: 'name' | 'description') => {
    if (sortField === field) {
      setSortDirection(prev => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null;
        return 'asc';
      });
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: 'name' | 'description') => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="h-4 w-4" />;
    return <ChevronsUpDown className="h-4 w-4" />;
  };

  let filteredSpecializations = specializations.filter(spec =>
    spec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    spec.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortDirection) {
    filteredSpecializations.sort((a, b) => {
      const aValue = a[sortField].toLowerCase();
      const bValue = b[sortField].toLowerCase();
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  const totalPages = Math.ceil(filteredSpecializations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSpecializations = filteredSpecializations.slice(startIndex, startIndex + itemsPerPage);

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen bg-secondary/30">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium">Loading specializations...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                  <Stethoscope className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Doctor Specializations</h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage medical specializations and areas of expertise
                  </p>
                </div>
              </div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg hover:shadow-md transition-all" size="lg">
                    <Plus className="h-5 w-5" />
                    Add Specialization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Specialization</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newSpecialization.name}
                        onChange={(e) => setNewSpecialization({ ...newSpecialization, name: e.target.value })}
                        className={`focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300 ${validationErrors.name ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.name && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.name[0]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newSpecialization.description}
                        onChange={(e) => setNewSpecialization({ ...newSpecialization, description: e.target.value })}
                        className={`focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300 ${validationErrors.description ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.description && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.description[0]}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Specialization'
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search specializations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-10 w-10"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="hover:bg-transparent flex items-center gap-2 -ml-4"
                    >
                      Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('description')}
                      className="hover:bg-transparent flex items-center gap-2 -ml-4"
                    >
                      Description
                      {getSortIcon('description')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSpecializations.map((specialization) => (
                  <TableRow key={specialization.id}>
                    <TableCell className="font-medium">{specialization.name}</TableCell>
                    <TableCell>{specialization.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            setSelectedSpecialization(specialization);
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => {
                            setSelectedSpecialization(specialization);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSpecializations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                          <Stethoscope className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-muted-foreground">
                          {searchQuery ? 'No specializations found matching your search' : 'No specializations found'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding a new specialization'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {filteredSpecializations.length > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSpecializations.length)} of {filteredSpecializations.length} specializations
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
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Specialization</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedSpecialization?.name || ''}
                    onChange={(e) => setSelectedSpecialization(selectedSpecialization ? 
                      { ...selectedSpecialization, name: e.target.value } : null)}
                    className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={selectedSpecialization?.description || ''}
                    onChange={(e) => setSelectedSpecialization(selectedSpecialization ? 
                      { ...selectedSpecialization, description: e.target.value } : null)}
                    className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Specialization'
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
                  This action cannot be undone. This will permanently delete the specialization
                  "{selectedSpecialization?.name}" and may affect related records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Specialization'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
};

export default SpecializationsPage;