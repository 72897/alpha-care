import { Skeleton } from '@/components/ui/skeleton';

const Panel = ({ className }: { className?: string }) => (
  <div
    className={`backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl ${
      className ?? ''
    }`}
  >
    <Skeleton className='h-6 w-48' />
    <div className='mt-6 space-y-4'>
      <Skeleton className='h-16 w-full rounded-xl' />
      <Skeleton className='h-16 w-full rounded-xl' />
      <Skeleton className='h-16 w-full rounded-xl' />
    </div>
  </div>
);

const Loading = () => (
  <div className='max-w-6xl mx-auto py-8 px-4 space-y-6 min-h-[calc(100vh-140px)]'>
    <div className='backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-6 shadow-xl'>
      <div className='flex items-center gap-5'>
        <Skeleton className='size-[90px] rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-80' />
        </div>
      </div>
      <div className='flex gap-3'>
        <Skeleton className='h-10 w-28 rounded-md' />
        <Skeleton className='h-10 w-28 rounded-md' />
      </div>
    </div>

    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
      <div className='lg:col-span-5 space-y-6'>
        <Panel />
        <Panel />
      </div>
      <Panel className='lg:col-span-7' />
    </div>
  </div>
);

export default Loading;
