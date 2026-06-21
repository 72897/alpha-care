// components/DatePicker.tsx
'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function AppointmentDatePicker({
  onSelect,
}: {
  onSelect: (date: Date) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const handleChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      onSelect(date);
    }
  };

  return (
    <div className='card-interview'>
      <div className='flex flex-col gap-2 rounded-full'>
        <label className='font-medium mb-2'>Select Appointment Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          dateFormat='MMMM d, yyyy'
          className='border px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholderText='Select a date'
        />
      </div>
    </div>
  );
}
