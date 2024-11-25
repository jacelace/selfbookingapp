'use client';

import AdminDashboard from '../../components/admin/AdminDashboard';
import { useFirebase } from '../../FirebaseProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DashboardPage() {
  const { user, loading, isAdmin } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');  // Redirect to login page if not authenticated
    } else if (!loading && !isAdmin) {
      router.push('/');  // Redirect to main page if authenticated but not admin
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminDashboard />
  );
}

// Update AdminDashboard component to pass users to BookingCalendar and handle data fetching
// This code is not part of the original file, but it's included here for completeness
// It should be placed in a separate file, e.g. components/admin/AdminDashboard.tsx

// import { useState, useEffect } from 'react';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../../firebase/clientApp';
// import { useRouter } from 'next/navigation';
// import BookingCalendar from '../../components/admin/BookingCalendar';
// import { EnhancedBooking, EnhancedUser, Label } from '../../types';
// import LoadingSpinner from '../../components/LoadingSpinner';
// import { toast } from '../../components/ui/use-toast';

// export default function AdminDashboard() {
//   const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
//   const [users, setUsers] = useState<EnhancedUser[]>([]);
//   const [labels, setLabels] = useState<Label[]>([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   const fetchData = async () => {
//     try {
//       // Fetch labels first
//       const labelsSnapshot = await getDocs(collection(db, 'labels'));
//       const labelsData = labelsSnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       })) as Label[];
//       setLabels(labelsData);

//       // Fetch users with their labels
//       const usersSnapshot = await getDocs(collection(db, 'users'));
//       const usersData = usersSnapshot.docs.map(doc => {
//         const userData = doc.data();
//         const userLabel = labelsData.find(l => l.id === userData.labelId);
//         return {
//           id: doc.id,
//           ...userData,
//           labelName: userLabel?.name,
//           labelColor: userLabel?.color,
//         };
//       }) as EnhancedUser[];
//       setUsers(usersData);

//       // Fetch bookings
//       const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
//       const bookingsData = bookingsSnapshot.docs.map(doc => {
//         const bookingData = doc.data();
//         const user = usersData.find(u => u.id === bookingData.userId);
//         return {
//           id: doc.id,
//           ...bookingData,
//           userName: user?.name || 'Unknown User',
//           userLabel: user?.labelName,
//           userLabelColor: user?.labelColor,
//         };
//       }) as EnhancedBooking[];
//       setBookings(bookingsData);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to fetch data',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-6">
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//         </div>

//         <BookingCalendar
//           bookings={bookings}
//           users={users}
//           onRefresh={fetchData}
//         />
//       </div>
//     </div>
//   );
// }
