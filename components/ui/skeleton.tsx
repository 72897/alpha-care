import { cn } from '@/lib/utils';

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    aria-hidden='true'
    className={cn('animate-pulse rounded-md bg-white/10', className)}
    {...props}
  />
);

export { Skeleton };
