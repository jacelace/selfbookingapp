"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Settings } from 'lucide-react'
import BookingCalendar from '../components/BookingCalendar'
import { BookingForm } from '../components/BookingForm'

interface User {
  id: string;
  name: string;
  totalSessions: number;
  remainingBookings: number;
}

interface Booking {
  id: string;
  userId: string;
  date: Date;
  time: string;
}

export default function BookingApp() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [booking, setBooking] = useState<{ userId: string; date: Date; time: string } | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleAddBooking = (userId: string, date: Date, time: string) => {
    const newBooking = { id: (bookings.length + 1).toString(), userId, date, time }
    setBookings([...bookings, newBooking])
    setBooking({ userId, date, time })
    setShowConfirmation(false)
    setTimeout(() => setShowConfirmation(true), 100) // Delay to trigger animation
  }

  // Mock users data with totalSessions and remainingBookings
  const users: User[] = [
    { id: '1', name: 'John Doe', totalSessions: 10, remainingBookings: 8 },
    { id: '2', name: 'Jane Smith', totalSessions: 15, remainingBookings: 12 },
  ]

  useEffect(() => {
    // Add custom styles for animations and background
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .fade-in {
        animation: fadeIn 0.5s ease-out forwards;
      }
      body {
        background-color: #f0f4f8;
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Booking System</h1>
          <Link href="/admin">
            <Button variant="outline" size="icon" className="hover:bg-gray-100 transition-colors duration-200">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-xl sm:text-2xl">Select Date</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <BookingCalendar onDateSelect={handleDateSelect} selectedDate={selectedDate} bookings={bookings} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-xl sm:text-2xl">Book a Session</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <BookingForm
                users={users}
                onAddBooking={handleAddBooking}
                selectedDate={selectedDate}
              />
            </CardContent>
          </Card>
        </div>

        {booking && showConfirmation && (
          <Card className="mt-8 sm:mt-12 shadow-lg bg-green-50 border-green-200 fade-in">
            <CardHeader className="bg-green-100 border-b border-green-200">
              <CardTitle className="text-xl sm:text-2xl text-green-800">Booking Confirmed</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-green-800">
                <p><span className="font-semibold">User:</span> {users.find(user => user.id === booking.userId)?.name}</p>
                <p><span className="font-semibold">Date:</span> {booking.date.toDateString()}</p>
                <p><span className="font-semibold">Time:</span> {booking.time}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}