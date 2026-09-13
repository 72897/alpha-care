import { CheckupCardSkeletonRow } from '@/components/CheckupCardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

const Loading = () => (
  <div className='max-w-6xl mx-auto py-6 px-4'>
    <div className='flex items-center gap-4 mb-8'>
      <Skeleton className='h-10 w-32 rounded-md' />
      <Skeleton className='h-9 w-72' />
    </div>
    <CheckupCardSkeletonRow count={6} />
  </div>
);

export default Loading;
