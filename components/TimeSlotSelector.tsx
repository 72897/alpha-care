// components/TimeSlotSelector.tsx
'use client';

type TimeSlotSelectorProps = {
  slots: string[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
};

export default function TimeSlotSelector({
  slots,
  selectedSlot,
  onSelect,
}: TimeSlotSelectorProps) {
  return (
    <div className='grid grid-cols-3 gap-4 card-interview mt-1'>
      {slots.map((slot) => (
        <button
          key={slot}
          className={`  border px-4 py-2 rounded-full ${
            selectedSlot === slot
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-500 '
          }`}
          onClick={() => onSelect(slot)}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
