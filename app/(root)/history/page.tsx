import { getCurrentUser } from '@/lib/actions/auth.action';
import { getInterviewsByUserId } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';
import InterviewCard from '@/components/InterviewCard';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const HistoryPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  const userInterviews = await getInterviewsByUserId();
  const hasCheckups = userInterviews && userInterviews.length > 0;

  return (
    <div className='max-w-6xl mx-auto py-6 px-4'>
      <div className='flex items-center gap-4 mb-8 text-white'>
        <Button asChild variant='outline' className='border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer'>
          <Link href='/' className='flex items-center gap-2'>
            <ChevronLeft size={16} />
            Dashboard
          </Link>
        </Button>
        <h1 className='text-3xl font-bold'>Your Checkup History</h1>
      </div>

      <div className='interviews-section'>
        {hasCheckups ? (
          userInterviews.map((interview) => (
            <InterviewCard {...interview} key={interview.id} />
          ))
        ) : (
          <div className='bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-300'>
            <p className='text-lg mb-4'>You haven&apos;t taken any health checkups yet.</p>
            <Button asChild className='btn-primary'>
              <Link href='/interview'>Book Your Appointment</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
