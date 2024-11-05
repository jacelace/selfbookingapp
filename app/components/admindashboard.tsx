'use client';

import { useState, useEffect } from 'react';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs, query, where, updateDoc, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/clientApp';
import { 
  EnhancedUser, 
  EnhancedBooking, 
  Label as LabelType, 
  TimeString, 
  RecurringOption, 
  BookingCount, 
  SessionCount,
  BookingStatus 
} from '../types/shared';
import ColorLabel from './ColorLabel';
import LoadingSpinner from './LoadingSpinner';

// Helper function to create branded types
const createBookingCount = (n: number): BookingCount => n as BookingCount;
const createSessionCount = (n: number): SessionCount => n as SessionCount;

// Default label for initialization
const defaultLabel: LabelType = {
  id: 'default',
  name: 'Default',
  color: '#808080'
};

const availableTimes: TimeString[] = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM'
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([defaultLabel]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newUserName, setNewUserName] = useState('');
  const [newUserLabelId, setNewUserLabelId] = useState('');
  const [newUserTotalBookings, setNewUserTotalBookings] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#000000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeString | ''>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch labels first as they're needed for users
        const labelsSnapshot = await getDocs(collection(db, 'labels'));
        const fetchedLabels = labelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LabelType[];
        
        // If no labels exist, use the default label
        if (fetchedLabels.length === 0) {
          await addDoc(collection(db, 'labels'), defaultLabel);
          setLabels([defaultLabel]);
        } else {
          setLabels(fetchedLabels);
        }

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const fetchedUsers = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          const userLabel = fetchedLabels.find(l => l.id === data.labelId) || defaultLabel;
          return {
            id: doc.id,
            name: data.name || 'Unknown User',
            email: data.email || '',
            sessions: createSessionCount(data.sessions || 0),
            label: userLabel,
            totalBookings: createBookingCount(data.totalBookings || 0),
            remainingBookings: createBookingCount(data.remainingBookings || 0),
            totalSessions: createSessionCount(data.totalSessions || 0),
            isAdmin: data.isAdmin || false,
            isApproved: data.isApproved || false,
            role: data.role || 'user'
          } as EnhancedUser;
        });
        setUsers(fetchedUsers);

        // Fetch bookings
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const fetchedBookings = bookingsSnapshot.docs
          .filter(doc => !doc.data().isDummy)
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              userName: data.userName,
              userLabel: data.userLabel,
              date: data.date,
              time: data.time as TimeString,
              recurring: data.recurring as RecurringOption,
              recurringCount: data.recurringCount,
              status: data.status as BookingStatus || 'confirmed',
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate()
            } as EnhancedBooking;
          });
        setBookings(fetchedBookings);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddUser = async () => {
    if (!newUserName || !newUserLabelId || !newUserTotalBookings) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedLabel = labels.find(l => l.id === newUserLabelId) || defaultLabel;
      const bookingCount = createBookingCount(parseInt(newUserTotalBookings));
      const newUser: Omit<EnhancedUser, 'id'> = {
        name: newUserName,
        email: '',
        label: selectedLabel,
        totalBookings: bookingCount,
        remainingBookings: bookingCount,
        sessions: createSessionCount(0),
        totalSessions: createSessionCount(0),
        isAdmin: false,
        isApproved: true,
        role: 'user'
      };

      const docRef = await addDoc(collection(db, 'users'), {
        ...newUser,
        labelId: selectedLabel.id
      });
      
      setUsers([...users, { ...newUser, id: docRef.id }]);
      setNewUserName('');
      setNewUserLabelId('');
      setNewUserTotalBookings('');
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLabel = async () => {
    if (!newLabelName || !newLabelColor) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newLabel: Omit<LabelType, 'id'> = {
        name: newLabelName,
        color: newLabelColor,
      };

      const docRef = await addDoc(collection(db, 'labels'), newLabel);
      setLabels([...labels, { ...newLabel, id: docRef.id }]);
      
      setNewLabelName('');
      setNewLabelColor('#000000');
    } catch (err) {
      console.error('Error adding label:', err);
      setError('Failed to add label. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeSelect = (time: TimeString) => {
    setSelectedTime(time);
  };

  const handleAddBooking = async (userId: string) => {
    if (!selectedTime) {
      setError('Please select a time');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      const newBooking: Omit<EnhancedBooking, 'id'> = {
        userId,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        recurring: isRecurring ? 'weekly' : 'none',
        recurringCount: isRecurring ? Number(user.remainingBookings) : 1,
        userName: user.name,
        userLabel: user.label.name,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      const bookingWithId: EnhancedBooking = { ...newBooking, id: docRef.id };
      setBookings(prev => [...prev, bookingWithId]);

      // Update user's remaining bookings
      const userRef = doc(db, 'users', userId);
      const updatedUser = {
        ...user,
        remainingBookings: createBookingCount(Number(user.remainingBookings) - 1)
      };
      await updateDoc(userRef, updatedUser);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));

      if (isRecurring) {
        // Create recurring bookings
        const recurringBookings = Array.from({ length: Number(user.remainingBookings) - 1 }).map((_, i) => {
          const nextDate = new Date(selectedDate);
          nextDate.setDate(nextDate.getDate() + (7 * (i + 1)));
          const recurringBooking: Omit<EnhancedBooking, 'id'> = {
            userId,
            date: nextDate.toISOString().split('T')[0],
            time: selectedTime,
            recurring: 'weekly',
            recurringCount: Number(user.remainingBookings),
            userName: user.name,
            userLabel: user.label.name,
            status: 'confirmed',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return recurringBooking;
        });

        for (const booking of recurringBookings) {
          const docRef = await addDoc(collection(db, 'bookings'), booking);
          const bookingWithId: EnhancedBooking = { ...booking, id: docRef.id };
          setBookings(prev => [...prev, bookingWithId]);
        }

        // Update user's remaining bookings to 0 since all slots are now booked
        const finalUserUpdate = {
          ...user,
          remainingBookings: createBookingCount(0)
        };
        await updateDoc(userRef, finalUserUpdate);
        setUsers(users.map(u => u.id === userId ? finalUserUpdate : u));
      }

      // Reset booking form
      setSelectedTime('');
      setIsRecurring(false);
    } catch (err) {
      console.error('Error adding booking:', err);
      setError('Failed to add booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      booking.date === date.toISOString().split('T')[0]
    ).map(booking => {
      const user = users.find(u => u.id === booking.userId);
      const label = labels.find(l => l.name === booking.userLabel) || defaultLabel;
      return {
        ...booking,
        userName: user?.name || 'Unknown',
        userLabel: label.name
      };
    });
  };

  // Filter and sort bookings
  const filteredAndSortedBookings = [...bookings]
    .filter(booking => {
      if (filterLabel !== 'all' && booking.userLabel !== filterLabel) return false;
      if (filterStatus !== 'all' && booking.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-destructive mb-4">{error}</div>
              <Button onClick={() => window.location.reload()}>
                Retry Loading
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Booking
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Bookings for {selectedDate.toDateString()}</h3>
              <div className="space-y-2">
                {getBookingsForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No bookings for this date</p>
                ) : (
                  getBookingsForDate(selectedDate).map(booking => (
                    <div key={booking.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span>{booking.userName}</span>
                        <ColorLabel 
                          name={booking.userLabel} 
                          color={labels.find(l => l.name === booking.userLabel)?.color || defaultLabel.color} 
                        />
                      </div>
                      <span className="text-muted-foreground">{booking.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New User */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userName">Name</Label>
                <Input
                  id="userName"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="userLabel">Label</Label>
                <Select onValueChange={setNewUserLabelId} value={newUserLabelId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a label" />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((label) => (
                      <SelectItem key={label.id} value={label.id}>
                        <ColorLabel name={label.name} color={label.color} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="userTotalBookings">Total Bookings</Label>
                <Input
                  id="userTotalBookings"
                  type="number"
                  value={newUserTotalBookings}
                  onChange={(e) => setNewUserTotalBookings(e.target.value)}
                  placeholder="Enter total bookings"
                  className="mt-1"
                  min="1"
                />
              </div>
              <Button 
                onClick={handleAddUser} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? <LoadingSpinner size={16} /> : 'Add User'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Label */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Add New Label</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="labelName">Label Name</Label>
                <Input
                  id="labelName"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Enter label name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="labelColor">Label Color</Label>
                <Input
                  id="labelColor"
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
              <Button 
                onClick={handleAddLabel} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? <LoadingSpinner size={16} /> : 'Add Label'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Total Bookings</TableHead>
                    <TableHead>Remaining Bookings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          <ColorLabel name={user.label.name} color={user.label.color} />
                        </TableCell>
                        <TableCell>{Number(user.totalBookings)}</TableCell>
                        <TableCell>{Number(user.remainingBookings)}</TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={Number(user.remainingBookings) === 0}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Booking
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium leading-none">Add Booking</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Create a new booking for {user.name}
                                  </p>
                                </div>
                                <div className="grid gap-2">
                                  <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="date">Date</Label>
                                    <div className="col-span-2">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            id="date"
                                            variant="outline"
                                            className={`w-full justify-start text-left font-normal ${
                                              !selectedDate && "text-muted-foreground"
                                            }`}
                                          >
                                            {selectedDate ? (
                                              selectedDate.toDateString()
                                            ) : (
                                              <span>Pick a date</span>
                                            )}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => date && setSelectedDate(date)}
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="time">Time</Label>
                                    <Select
                                      value={selectedTime}
                                      onValueChange={handleTimeSelect}
                                    >
                                      <SelectTrigger className="col-span-2">
                                        <SelectValue placeholder="Select time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableTimes.map((time) => (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="recurring"
                                      checked={isRecurring}
                                      onCheckedChange={(checked) => setIsRecurring(checked === true)}
                                    />
                                    <Label htmlFor="recurring">Recurring weekly</Label>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => handleAddBooking(user.id)}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? <LoadingSpinner size={16} /> : 'Add Booking'}
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* All Bookings */}
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Bookings</CardTitle>
              <div className="flex space-x-4">
                <Select onValueChange={setFilterLabel} value={filterLabel}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labels</SelectItem>
                    {labels.map((label) => (
                      <SelectItem key={label.id} value={label.name}>
                        <ColorLabel name={label.name} color={label.color} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value as BookingStatus | 'all')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedBookings.map((booking) => {
                      const user = users.find(u => u.id === booking.userId);
                      const label = labels.find(l => l.name === booking.userLabel) || defaultLabel;
                      const bookingDate = new Date(booking.date);
                      
                      return (
                        <TableRow key={booking.id}>
                          <TableCell>
                            {bookingDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>{booking.time}</TableCell>
                          <TableCell>{user?.name || booking.userName || 'Unknown'}</TableCell>
                          <TableCell>
                            <ColorLabel name={label.name} color={label.color} />
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.recurring === 'weekly' 
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.recurring === 'weekly' ? 'Recurring' : 'Single'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {booking.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
