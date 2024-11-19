'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { collection, addDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/clientApp';
import { toast } from '../ui/use-toast';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';

interface TimeOffPeriod {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
}

export function TimeOffManagement() {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOffPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing time-off periods
  useEffect(() => {
    const fetchTimeOffPeriods = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'timeOff'));
        const periods = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate.toDate(),
          endDate: doc.data().endDate.toDate()
        })) as TimeOffPeriod[];
        setTimeOffPeriods(periods);
      } catch (error) {
        console.error('Error fetching time-off periods:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch time-off periods',
          variant: 'destructive',
        });
      }
    };

    fetchTimeOffPeriods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: 'Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    // Check for overlapping periods
    const isOverlapping = timeOffPeriods.some(period => {
      return (
        (startDate >= period.startDate && startDate <= period.endDate) ||
        (endDate >= period.startDate && endDate <= period.endDate) ||
        (startDate <= period.startDate && endDate >= period.endDate)
      );
    });

    if (isOverlapping) {
      toast({
        title: 'Error',
        description: 'This period overlaps with an existing time-off period',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'timeOff'), {
        title,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
      });

      // Add the new period to the local state
      setTimeOffPeriods([...timeOffPeriods, {
        id: Math.random().toString(), // temporary ID until refresh
        title,
        startDate,
        endDate,
      }]);

      // Reset form
      setTitle('');
      setStartDate(undefined);
      setEndDate(undefined);

      toast({
        title: 'Success',
        description: 'Time-off period added successfully',
      });
    } catch (error) {
      console.error('Error adding time-off period:', error);
      toast({
        title: 'Error',
        description: 'Failed to add time-off period',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this time-off period?')) {
      try {
        await deleteDoc(collection(db, 'timeOff', id));
        setTimeOffPeriods(timeOffPeriods.filter(period => period.id !== id));
        toast({
          title: 'Success',
          description: 'Time-off period deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting time-off period:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete time-off period',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter time-off title"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
        >
          {isLoading ? 'Adding...' : 'Add Time Off'}
        </Button>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Existing Time-Off Periods</h3>
        {timeOffPeriods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time-off periods set</p>
        ) : (
          <div className="space-y-2">
            {timeOffPeriods.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div>
                  <h4 className="font-medium">{period.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(period.startDate, 'PPP')} - {format(period.endDate, 'PPP')}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(period.id)}
                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
