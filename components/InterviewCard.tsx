/* eslint-disable @next/next/no-img-element */
import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';

// Feedback is passed in rather than fetched here. Fetching it per card meant a
// session verification plus a Firestore query for every card on the page, so a
// dashboard with ten checkups paid it ten times over.
const InterviewCard = ({
  id,
  role,
  type,
  createdAt,
  feedback = null,
}: InterviewCardProps & { feedback?: Feedback | null }) => {
  const normalizedType = /mix/gi.test(type) ? 'Medium' : type;

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format('YYYY-MM-DD');

  // Seeded from the interview id so the avatars stay put between renders.
  // Math.random() here meant every navigation produced new faces and four
  // fresh Dicebear requests per card.
  const seed = id ?? role;

  const avatarURLs = Array.from(
    { length: 3 },
    (_, index) =>
      `https://api.dicebear.com/7.x/bottts/svg?seed=health-${seed}-${index}`
  );

  return (
    <div className='card-border w-[360px]  max-sm:w-full min-h-96'>
      <div className='card-interview'>
        <div>
          <div className='absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-light-600'>
            <p className='badge-text'>{normalizedType}</p>
          </div>

          <img
            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`}
            alt='avatar'
            width={90}
            height={90}
            className='rounded-full object-fit size-[90px] bg-black outline hover:shadow-lg transition-transform transform hover:scale-125'
          />
          <h3 className='mt-5 capitalize'>{role} Checkup</h3>
          <div className='flex flex-row gap-5 mt-3'>
            <div className='flex flex-row gap-5 mt-3'>
              <Image
                src='/calendar.svg'
                alt='calander'
                width={22}
                height={22}
              />
              <p>{formattedDate}</p>
            </div>

            <div className='flex flex-row gap-2 items-center mt-3'>
              <Image src='/star.svg' alt='star' width={22} height={22} />
              <p>{feedback?.totalScore || '---'} / 100</p>
            </div>
          </div>

          <p className='line-clamp-2 mt-5'>
            {feedback?.finalAssessment ||
              "You haven't taken the checkup yet. Take it now to knnow your health"}
          </p>
        </div>

        <div className='flex flex-row justify-between'>
          <div className='flex flex-row items-center'>
            {avatarURLs.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Health icon ${index + 1}`}
                width={40}
                height={40}
                className={`rounded-full bg-white border border-gray-300 shadow
                hover:shadow-lg transition-transform transform hover:scale-110
                ${index !== 0 ? '-ml-3' : ''}`}
              />
            ))}
          </div>

          <Button className='btn-primary'>
            <Link
              href={feedback ? `/interview/${id}/feedback` : `/interview/${id}`}
            >
              {feedback ? 'Check Feedback' : 'Start Checkup'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
