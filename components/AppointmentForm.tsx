// components/AppointmentForm.tsx
'use client';
import { Button } from '@/components/ui/button';

import { useState } from 'react';
import AppointmentDatePicker from './DatePicker';
import TimeSlotSelector from './TimeSlotSelector';

const fakeSlots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '4:00 PM'];

export default function AppointmentForm() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleBook = () => {
    if (!selectedDate || !selectedSlot)
      return alert('Please select both date and time!');
    alert(`Booked for ${selectedDate.toDateString()} at ${selectedSlot}`);
    // Send to Firebase here
  };

  return (
    <div className='card-border w-[360px]  max-sm:w-full min-h-96'>
      <div className='card-interview'>
        <AppointmentDatePicker onSelect={setSelectedDate} />
        <TimeSlotSelector
          slots={fakeSlots}
          selectedSlot={selectedSlot}
          onSelect={setSelectedSlot}
        />
        <Button className='btn-primary w-full' onClick={handleBook}>
          Book Appointment
        </Button>
      </div>
    </div>
  );
}
