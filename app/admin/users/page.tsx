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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Users as UsersIcon,
  Search,
  Loader2,
  Building,
  Briefcase,
  Phone,
  User,
  Shield,
  Stethoscope,
  Mail,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Specialization {
  id: string;
  name: string;
  description: string;
}

interface User {
  employeeNumber: number;
  fullNameEnglish: string;
  fullNameArabic: string;
  gender: string;
  email: string;
  mobileNo: string;
  branchName: string;
  branchNo: number;
  department: string;
  jobTitle: string;
  roleName: string;
  specializationName?: string;
}

type SortField = 'fullNameEnglish' | 'email' | 'department' | 'branchName' | 'roleName' | 'specializationName';
type SortDirection = 'asc' | 'desc' | null;

const DOCTOR_ROLE_NAME = 'Doctor';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSpecializationDialogOpen, setIsSpecializationDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<string>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isUpdatingSpecialization, setIsUpdatingSpecialization] = useState(false);
  const [isLoadingSpecializations, setIsLoadingSpecializations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('fullNameEnglish');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchRoles()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users', {
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
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error fetching users",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive",
      });
    }
  }

  async function fetchRoles() {
    try {
      const response = await fetch('/api/roles', {
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
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error fetching roles",
        description: error instanceof Error ? error.message : "Failed to load roles",
        variant: "destructive",
      });
    }
  }

  async function fetchDoctorSpecializations() {
    try {
      setIsLoadingSpecializations(true);
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
        const errorMessage = errorData?.message || errorData?.error || `Failed to fetch specializations (Status: ${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array of specializations');
      }

      setSpecializations(data);
    } catch (error) {
      console.error('Error fetching specializations:', error);
      toast({
        title: "Error fetching specializations",
        description: error instanceof Error ? error.message : "Failed to load specializations",
        variant: "destructive",
      });
      setSpecializations([]); // Reset to empty array on error
    } finally {
      setIsLoadingSpecializations(false);
    }
  }

  async function handleRoleAssignment() {
    if (!selectedUser || !selectedRoleId) return;

    setIsUpdatingRole(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.employeeNumber}/role`, {
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
          roleId: selectedRoleId
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.title || 'Failed to update user role');
      }

   // Reload the users list to get fresh data
   await fetchUsers();

      setIsRoleDialogOpen(false);
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });

    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  }

  async function handleSpecializationAssignment() {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "No user selected",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingSpecialization(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.employeeNumber}/specialization`, {
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
          specializationId: selectedSpecializationId
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to assign specialization');
      }

      // Reload the users list to get fresh data
      await fetchUsers();

      setIsSpecializationDialogOpen(false);
      toast({
        title: "Success",
        description: "Specialization assigned successfully",
      });

    } catch (error) {
      console.error('Error assigning specialization:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign specialization",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSpecialization(false);
    }
  }

  const handleSort = (field: SortField) => {
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="h-4 w-4" />;
    return <ChevronsUpDown className="h-4 w-4" />;
  };

  const isDoctor = (user: User) => {
    return user.roleName === DOCTOR_ROLE_NAME;
  };

  let filteredUsers = users.filter(user =>
    user.fullNameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.specializationName && user.specializationName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (sortDirection) {
    filteredUsers.sort((a, b) => {
      const aValue = String(a[sortField] || '').toLowerCase();
      const bValue = String(b[sortField] || '').toLowerCase();
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary/30">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium">Loading users...</span>
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
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                  <UsersIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage and organize system users and their roles
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 shadow-sm bg-white dark:bg-gray-900 focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
                />
              </div>
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-gray-900 px-4 py-2.5 rounded-lg shadow-sm border">
                <UsersIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">{users.length} users</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('fullNameEnglish')}
                      className="hover:bg-transparent flex items-center gap-2 -ml-4"
                    >
                      Name
                      {getSortIcon('fullNameEnglish')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('department')}
                      className="hover:bg-transparent flex items-center gap-2 -ml-4"
                    >
                      Department
                      {getSortIcon('department')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('branchName')}
                      className="hover:bg-transparent flex items-center gap-2 -ml-4"
                    >
                      Branch
                      {getSortIcon('branchName')}
                    </Button>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('roleName')}
                      className="hover:bg-transparent flex items-center gap-2 -ml-4"
                    >
                      Role & Specialization
                      {getSortIcon('roleName')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.employeeNumber} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.fullNameEnglish}</div>
                          <div className="text-sm text-muted-foreground">{user.fullNameArabic}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                          <Briefcase className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-medium">{user.department}</div>
                          <div className="text-sm text-muted-foreground">{user.jobTitle}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.branchName}</div>
                          <div className="text-sm text-muted-foreground">Branch #{user.branchNo}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                            <Phone className="h-4 w-4 text-orange-500" />
                          </div>
                          <span className="text-sm font-medium">{user.mobileNo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">
                            {user.roleName || 'No Role'}
                          </span>
                        </div>
                        {isDoctor(user) && (
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                              <Stethoscope className="h-4 w-4 text-orange-500" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {user.specializationName || 'No Specialization'}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <div className="flex items-center justify-end gap-2 px-4">
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors rounded-lg"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRoleId('');
                                  setIsRoleDialogOpen(true);
                                }}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" align="center">
                              <p>Change Role</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {isDoctor(user) && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-500 transition-colors rounded-lg"
                                  onClick={async () => {
                                    setSelectedUser(user);
                                    setSelectedSpecializationId('');
                                    await fetchDoctorSpecializations();
                                    setIsSpecializationDialogOpen(true);
                                  }}
                                >
                                  <Stethoscope className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left" align="center">
                                <p>Assign Specialization</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-xl bg-muted/20 flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-muted-foreground">
                          No users found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding a new user'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {filteredUsers.length > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
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

          <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogDescription>
                  Update the role for {selectedUser?.fullNameEnglish}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedUser?.fullNameEnglish}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Current Role</div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm">{selectedUser?.roleName || 'No Role'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Select New Role</div>
                    <Select
                      value={selectedRoleId}
                      onValueChange={setSelectedRoleId}
                    >
                      <SelectTrigger className="w-full focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/15 focus:border-green-300/70 focus:shadow-lg focus:shadow-green-500/8 backdrop-blur-sm transition-all duration-300">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleRoleAssignment}
                  disabled={isUpdatingRole || !selectedRoleId}
                >
                  {isUpdatingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Role...
                    </>
                  ) : (
                    'Update Role'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isSpecializationDialogOpen} onOpenChange={setIsSpecializationDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Specialization</DialogTitle>
                <DialogDescription>
                  Update the specialization for {selectedUser?.fullNameEnglish}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedUser?.fullNameEnglish}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Current Specialization</div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Stethoscope className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{selectedUser?.specializationName || 'No Specialization'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Select Specialization</div>
                    {isLoadingSpecializations ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Select
                        value={selectedSpecializationId}
                        onValueChange={setSelectedSpecializationId}
                      >
                        <SelectTrigger className="w-full focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/15 focus:border-orange-300/70 focus:shadow-lg focus:shadow-orange-500/8 backdrop-blur-sm transition-all duration-300">
                          <SelectValue placeholder="Select a specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map((specialization) => (
                            <SelectItem key={specialization.id} value={specialization.id}>
                              {specialization.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSpecializationAssignment}
                  disabled={isUpdatingSpecialization}
                >
                  {isUpdatingSpecialization ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning Specialization...
                    </>
                  ) : (
                    'Assign Specialization'
                  )}
                
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default UsersPage;