'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Users, Calendar, Tag, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { collection, query, doc, getDoc, setDoc, getDocs, orderBy, Timestamp, where, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseInit';
import type { EnhancedUser, EnhancedBooking, Label as LabelType } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import LabelManagement from './LabelManagement';
import BookingManagement from './BookingManagement';
import BookingCalendar from './BookingCalendar';
import CreateUserForm from './CreateUserForm';
import TimeOffManagement from './TimeOffManagement';
import { toast } from '../ui/use-toast';
import { useFirebase } from '../../FirebaseProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const AdminDashboard: React.FC = () => {
  // Data states
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLabelSubmitting, setIsLabelSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  // Firebase state
  const { user: adminUser, isAdmin, loading: authLoading } = useFirebase();

  // Error handling
  const handleError = useCallback((error: unknown, message: string) => {
    console.error(`${message}:`, error);
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  }, []);

  // Data fetching functions
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      const updatedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          ...data,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'user',
          status: data.status || 'pending',
          isAdmin: data.isAdmin || false,
          isApproved: data.isApproved || false,
          labelId: data.labelId || '',
          userLabel: data.userLabel || '',
          labelColor: data.labelColor || '',
          totalBookings: data.totalBookings || 0,
          remainingBookings: data.remainingBookings || 0,
          totalSessions: data.totalSessions || 0,
          sessions: data.sessions || 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt || Date.now())),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromDate(new Date(data.updatedAt || Date.now()))
        };
      });
      setUsers(updatedUsers);
    } catch (error) {
      handleError(error, 'Error fetching users');
    }
  }, [isAdmin, handleError]);

  const fetchBookings = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(bookingsQuery);
      const updatedBookings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date || Date.now())),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date()),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromDate(new Date())
        } as EnhancedBooking;
      });
      setBookings(updatedBookings);
    } catch (error) {
      handleError(error, 'Error fetching bookings');
    }
  }, [isAdmin, handleError]);

  const fetchLabels = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const labelsQuery = query(collection(db, 'labels'));
      const snapshot = await getDocs(labelsQuery);
      const updatedLabels = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          name: data.name || '',
          color: data.color || '#000000',
          isDefault: data.isDefault || false
        } as LabelType;
      });
      setLabels(updatedLabels);
    } catch (error) {
      handleError(error, 'Error fetching labels');
    }
  }, [isAdmin, handleError]);

  // Action handlers
  const handleRefresh = useCallback(async () => {
    if (loading) return;
    try {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchBookings(), fetchLabels()]);
      toast({
        title: "Success",
        description: "Data refreshed successfully",
        variant: "default",
      });
    } catch (error) {
      handleError(error, 'Error refreshing data');
    } finally {
      setLoading(false);
    }
  }, [loading, fetchUsers, fetchBookings, fetchLabels, handleError]);

  const handleUpdateUserLabel = useCallback(async (userId: string, labelId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { labelId }, { merge: true });
      await fetchUsers();
      toast({
        title: "Success",
        description: "User label updated successfully",
        variant: "default",
      });
    } catch (error) {
      handleError(error, 'Error updating user label');
    }
  }, [fetchUsers, handleError]);

  const handleUpdateUserSessions = useCallback(async (userId: string, sessions: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { sessions }, { merge: true });
      await fetchUsers();
      toast({
        title: "Success",
        description: "User sessions updated successfully",
        variant: "default",
      });
    } catch (error) {
      handleError(error, 'Error updating user sessions');
    }
  }, [fetchUsers, handleError]);

  const handleUpdateUserStatus = useCallback(async (userId: string, isApproved: boolean) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      await setDoc(userRef, {
        isApproved,
        status: isApproved ? 'approved' : 'pending',
        remainingBookings: isApproved ? (userData?.sessions || 0) : 0,
        updatedAt: Timestamp.now()
      }, { merge: true });
      await fetchUsers();
      toast({
        title: "Success",
        description: "User status updated successfully",
        variant: "default",
      });
    } catch (error) {
      handleError(error, 'Error updating user status');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, fetchUsers, handleError]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (isSubmitting) return;
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      setIsSubmitting(true);
      const bookingsQuery = query(collection(db, 'bookings'), where('userId', '==', userId));
      const bookingDocs = await getDocs(bookingsQuery);
      await Promise.all(bookingDocs.docs.map(doc => deleteDoc(doc.ref)));
      await deleteDoc(doc(db, 'users', userId));
      await Promise.all([fetchUsers(), fetchBookings()]);
      toast({
        title: "Success",
        description: "User and associated bookings deleted successfully",
        variant: "default",
      });
    } catch (error) {
      handleError(error, 'Error deleting user');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, fetchUsers, fetchBookings, handleError]);

  // Effects
  useEffect(() => {
    if (!isAdmin || authLoading) return;
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchBookings(), fetchLabels()]);
      } catch (error) {
        handleError(error, 'Error fetching initial data');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [isAdmin, authLoading, fetchUsers, fetchBookings, fetchLabels, handleError]);

  // Computed values
  const totalUsers = useMemo(() => users.length, [users]);
  const pendingUsers = useMemo(
    () => users.filter(user => user.status === 'pending' || !user.isApproved).length,
    [users]
  );
  const totalBookings = useMemo(() => bookings.length, [bookings]);
  const upcomingBookings = useMemo(
    () => bookings.filter(booking => {
      if (!booking.date) return false;
      const bookingDate = booking.date instanceof Timestamp ? booking.date.toDate() : new Date(booking.date);
      return bookingDate >= new Date(new Date().setHours(0, 0, 0, 0));
    }).length,
    [bookings]
  );

  // Memoize filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (showPendingOnly) {
        return !user.isApproved && matchesSearch;
      }
      return matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (!a.isApproved && b.isApproved) return -1;
      if (a.isApproved && !b.isApproved) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, searchQuery, showPendingOnly]);

  // Memoize the dashboard content
  const dashboardContent = useMemo(() => {
    if (error) {
      return (
        <div className="container mx-auto p-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-red-800">
                Error Loading Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-red-700">{error}</p>
                <Button
                  variant="outline"
                  className="bg-white hover:bg-red-100"
                  onClick={() => {
                    setError(null);
                    handleRefresh();
                  }}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, bookings, and settings</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {pendingUsers > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-orange-800">
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700">
                You have {pendingUsers} user{pendingUsers === 1 ? '' : 's'} waiting for approval
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto bg-gradient-to-r from-slate-50 to-gray-50 p-1 rounded-lg">
            <TabsTrigger 
              value="bookings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md py-3 text-sm font-medium"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md py-3 text-sm font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              Calendar/Users
            </TabsTrigger>
            <TabsTrigger 
              value="labels"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md py-3 text-sm font-medium"
            >
              <Tag className="w-4 h-4 mr-2" />
              Labels
            </TabsTrigger>
            <TabsTrigger 
              value="timeoff"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md py-3 text-sm font-medium"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Time Off
            </TabsTrigger>
          </TabsList>

          <style jsx global>{`
            /* Bookings section buttons */
            [data-state="active"][value="bookings"] ~ * button:not([variant="outline"]):not([variant="destructive"]) {
              background-image: linear-gradient(to right, var(--tw-gradient-from-blue-500), var(--tw-gradient-to-purple-500));
            }
            
            /* Users section buttons */
            [data-state="active"][value="users"] ~ * button:not([variant="outline"]):not([variant="destructive"]) {
              background-image: linear-gradient(to right, var(--tw-gradient-from-purple-500), var(--tw-gradient-to-pink-500));
            }
            
            /* Labels section buttons */
            [data-state="active"][value="labels"] ~ * button:not([variant="outline"]):not([variant="destructive"]) {
              background-image: linear-gradient(to right, var(--tw-gradient-from-pink-500), var(--tw-gradient-to-rose-500));
            }
            
            /* Time Off section buttons */
            [data-state="active"][value="timeoff"] ~ * button:not([variant="outline"]):not([variant="destructive"]) {
              background-image: linear-gradient(to right, var(--tw-gradient-from-rose-500), var(--tw-gradient-to-orange-500));
            }

            /* Hover states */
            [data-state="active"][value="bookings"] ~ * button:not([variant="outline"]):not([variant="destructive"]):hover {
              background-image: linear-gradient(to right, var(--tw-gradient-from-blue-600), var(--tw-gradient-to-purple-600));
            }
            
            [data-state="active"][value="users"] ~ * button:not([variant="outline"]):not([variant="destructive"]):hover {
              background-image: linear-gradient(to right, var(--tw-gradient-from-purple-600), var(--tw-gradient-to-pink-600));
            }
            
            [data-state="active"][value="labels"] ~ * button:not([variant="outline"]):not([variant="destructive"]):hover {
              background-image: linear-gradient(to right, var(--tw-gradient-from-pink-600), var(--tw-gradient-to-rose-600));
            }
            
            [data-state="active"][value="timeoff"] ~ * button:not([variant="outline"]):not([variant="destructive"]):hover {
              background-image: linear-gradient(to right, var(--tw-gradient-from-rose-600), var(--tw-gradient-to-orange-600));
            }
          `}</style>

          <TabsContent value="bookings" className="space-y-4">
            <BookingManagement
              bookings={bookings}
              users={users}
              labels={labels}
              onRefresh={() => {
                fetchBookings();
                fetchUsers();
              }}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Booking Calendar</CardTitle>
                  <CardDescription className="text-sm">View upcoming sessions</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <BookingCalendar
                    bookings={bookings}
                    users={users}
                    onRefresh={fetchBookings}
                  />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Create New User</CardTitle>
                  <CardDescription className="text-sm">Add a new user to the system</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <CreateUserForm 
                    labels={labels}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                    onSuccess={fetchUsers}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">User List</CardTitle>
                <CardDescription>View and manage existing users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Search users..."
                      className="max-w-sm"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      value={searchQuery}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        id="pending-only"
                        checked={showPendingOnly}
                        onCheckedChange={setShowPendingOnly}
                      />
                      <Label htmlFor="pending-only">Show pending only</Label>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>Sessions</TableHead>
                          <TableHead>Remaining</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedUsers.map((user) => (
                          <TableRow 
                            key={user.id} 
                            className={`hover:bg-muted/50 ${!user.isApproved ? 'bg-yellow-50' : ''}`}
                          >
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Select
                                value={user.labelId || ''}
                                onValueChange={(labelId) => handleUpdateUserLabel(user.id, labelId)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue>
                                    {labels.find(l => l.id === user.labelId)?.name || 'Select a label'}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {labels.map((label) => (
                                    <SelectItem key={label.id} value={label.id}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: label.color }}
                                        />
                                        {label.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={user.sessions}
                                onChange={(e) => {
                                  const sessions = parseInt(e.target.value);
                                  if (!isNaN(sessions) && sessions >= 0) {
                                    handleUpdateUserSessions(user.id, sessions);
                                  }
                                }}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>{user.remainingBookings}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.isApproved}
                                  onCheckedChange={(approved) => handleUpdateUserStatus(user.id, approved)}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {user.isApproved ? 'Approved' : 'Pending'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labels" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Label Management</CardTitle>
                <CardDescription className="text-sm">Manage therapy categories and labels</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <LabelManagement 
                  labels={labels}
                  setLabels={setLabels}
                  isSubmitting={isLabelSubmitting}
                  setIsSubmitting={setIsLabelSubmitting}
                  onRefresh={fetchLabels}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeoff" className="space-y-4">
            <TimeOffManagement />
          </TabsContent>
        </Tabs>
      </div>
    );
  }, [
    totalUsers,
    pendingUsers,
    loading,
    isSubmitting,
    isLabelSubmitting,
    handleRefresh,
    handleDeleteUser,
    filteredAndSortedUsers,
    users,
    bookings,
    labels,
    searchQuery,
    showPendingOnly,
    handleUpdateUserLabel,
    handleUpdateUserSessions,
    handleUpdateUserStatus,
    error,
    fetchBookings,
    fetchLabels,
    fetchUsers
  ]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!adminUser || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="default">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return dashboardContent;
};

export default AdminDashboard;
