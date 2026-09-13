import AppointmentForm from '@/components/AppointmentForm';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import InterviewCard from '@/components/InterviewCard';
import { getCurrentUser } from '@/lib/session';
import {
  getLatestInterviews,
  getUserCheckups,
} from '@/lib/actions/general.action';

const page = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  const [{ interviews: userInterviews, feedbackByInterviewId }, latestInterviews] =
    await Promise.all([
      getUserCheckups(),
      getLatestInterviews({ userId: user.id }),
    ]);

  const hasPastInterviews = (userInterviews?.length ?? 0) > 0;
  const hasUpcomingInterviews = (latestInterviews?.length ?? 0) > 0;

  return (
    <>
      <section className='card-cta '>
        <div className='flex flex-col gap-6 max-w-lg'>
          <h2>
            {' '}
            Assess your mental and physical well-being through an AI-powered
            conversational experience.
          </h2>
          <p className='text-lg'>
            Answer guided questions and receive instant feedback with
            improvement suggestions.
          </p>
          <Button asChild className='btn-primary max-sm:w-full'>
            <Link href='/interview'>Book Your Appointment</Link>
          </Button>
        </div>

        <Image
          src='/robot.png'
          alt='robot'
          width={400}
          height={400}
          className='max-sm:hidden'
        />
      </section>

      <section className='flex flex-col gap-6 mt-8'>
        <h2>Your Checkcups</h2>
        <div className='interviews-section'>
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                {...interview}
                key={interview.id}
                feedback={feedbackByInterviewId[interview.id] ?? null}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any checkup yet</p>
          )}
        </div>
      </section>

      <section className='flex flex-col gap-6 mt-8'>
        <h2>Take an instant Checkup</h2>
        <div className='interviews-section'>
          {hasUpcomingInterviews ? (
            latestInterviews?.map((interview) => (
              <InterviewCard
                {...interview}
                key={interview.id}
                feedback={feedbackByInterviewId[interview.id] ?? null}
              />
            ))
          ) : (
            <p>There are no new checkup available yet</p>
          )}
        </div>
      </section>

      {/* qwert */}
      <section className='  flex flex-col gap-6 mt-8'>
        <h2>Book an appointment with a real doctor</h2>

        <div className='interviews-section'>
          <AppointmentForm />
        </div>
      </section>
    </>
  );
};

export default page;
