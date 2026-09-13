import { CheckupCardSkeletonRow } from '@/components/CheckupCardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

// Without a loading boundary Next.js waits for the page's Firestore reads
// before sending any HTML, so a navigation looks like a frozen tab. This paints
// the shell straight away and streams the real content in behind it.
const Loading = () => (
  <>
    <section className='card-cta'>
      <div className='flex flex-col gap-6 max-w-lg w-full'>
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-8 w-4/5' />
        <Skeleton className='h-5 w-full' />
        <Skeleton className='h-12 w-52 rounded-full' />
      </div>
      <Skeleton className='size-[400px] rounded-2xl max-sm:hidden' />
    </section>

    <section className='flex flex-col gap-6 mt-8'>
      <Skeleton className='h-8 w-56' />
      <CheckupCardSkeletonRow />
    </section>

    <section className='flex flex-col gap-6 mt-8'>
      <Skeleton className='h-8 w-64' />
      <CheckupCardSkeletonRow />
    </section>
  </>
);

export default Loading;
