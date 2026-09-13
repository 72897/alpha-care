import Agent from '@/components/Agent';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  return (
    <>
      <h3>Book Your Appointment</h3>
      <p className='text-sm text-light-100 mb-4'>
        Have a quick word with our front desk about what&apos;s bothering you,
        and your checkup will be waiting on your dashboard.
      </p>

      <Agent
        userName={user.name}
        userId={user.id}
        // profileImage={user?.profileURL}
        type='generate'
      />
    </>
  );
};

export default Page;
