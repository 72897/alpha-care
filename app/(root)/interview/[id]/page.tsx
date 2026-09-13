/* eslint-disable @next/next/no-img-element */
import Agent from '@/components/Agent';
import { getCurrentUser } from '@/lib/session';
import { getInterviewsById } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';

const page = async ({ params }: RouteParams) => {
  const { id } = await params;

  const [user, interview] = await Promise.all([
    getCurrentUser(),
    getInterviewsById(id),
  ]);

  if (!interview) redirect('/');

  // Seeded from the id so the avatars are stable rather than re-rolled (and
  // re-fetched from Dicebear) on every render.
  const avatarURLs = Array.from(
    { length: 3 },
    (_, index) => `https://api.dicebear.com/7.x/bottts/svg?seed=health-${id}-${index}`
  );

  return (
    <>
      <div className='flex flex-row gap-4 justify-between mb-5'>
        <div className='flex flex-row gap-4 items-center '>
          <div className='flex flex-row gap-4'>
            <img
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${id}`}
              alt='avatar'
              width={20}
              height={20}
              className='rounded-full object-fit size-[90px] bg-black outline hover:shadow-lg transition-transform transform hover:scale-125'
            />

            <h3 className='capitalize justify-center text-center mt-7'>
              {' '}
              {interview.role} Checkup
            </h3>
          </div>
          <div className='flex flex-row items-center'>
            {avatarURLs.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Health icon ${index + 1}`}
                width={30}
                height={30}
                className={`rounded-full bg-white border border-gray-300 shadow
                hover:shadow-lg transition-transform transform hover:scale-110
                ${index !== 0 ? '-ml-3' : ''}`}
              />
            ))}
          </div>
        </div>

        <p className='bg-dark-200 px-4 py-2 rounded-lg capitalize h-[40px] w-auto mt-7'>
          {interview.type}
        </p>
      </div>

      <Agent
        userName={user?.name || ''}
        userId={user?.id}
        interviewId={id}
        type='interview'
        questions={interview.questions}
      />
    </>
  );
};

export default page;
