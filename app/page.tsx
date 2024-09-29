import Link from 'next/link';
import AdminDashboard from './components/admindashboard';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="space-x-4">
            <Link href="/booking" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Go to Booking Page
            </Link>
            <Link href="/auth" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Sign In / Sign Up
            </Link>
          </div>
        </div>
        <AdminDashboard />
      </div>
    </main>
  );
}