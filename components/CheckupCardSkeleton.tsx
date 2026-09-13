import { Skeleton } from '@/components/ui/skeleton';

// Matches InterviewCard's footprint so the layout doesn't jump when the real
// cards arrive.
const CheckupCardSkeleton = () => (
  <div className='card-border w-[360px] max-sm:w-full min-h-96'>
    <div className='card-interview'>
      <div className='w-full'>
        <Skeleton className='size-[90px] rounded-full' />
        <Skeleton className='mt-5 h-6 w-40' />
        <div className='mt-6 flex gap-5'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-5 w-20' />
        </div>
        <div className='mt-5 space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </div>
      </div>
      <div className='flex flex-row items-center justify-between'>
        <Skeleton className='h-10 w-24 rounded-full' />
        <Skeleton className='h-10 w-32 rounded-full' />
      </div>
    </div>
  </div>
);

export const CheckupCardSkeletonRow = ({ count = 3 }: { count?: number }) => (
  <div className='interviews-section'>
    {Array.from({ length: count }, (_, index) => (
      <CheckupCardSkeleton key={index} />
    ))}
  </div>
);

export default CheckupCardSkeleton;
