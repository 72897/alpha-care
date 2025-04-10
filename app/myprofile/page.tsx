/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-img-element */
'use client';

import DeleteUserModal from '@/components/DeleteUser';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/Loading';
import { auth } from '@/firebase/Client';
import { signOut } from '@/lib/actions/auth.action';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoMdExit } from 'react-icons/io';

const ProfileCard = () => {
  const [user, setUser] = useState<any>(null);
  const [avatarSeed, setAvatarSeed] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAvatarSeed(`user-${Math.floor(Math.random() * 1000)}`);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!user)
    return (
      <>
        <div className='top-50% '>
          <Loader />
        </div>
      </>
    );

  const router = useRouter();

  return (
    <div
      className='w-[360px] h-screen max-sm:w-full min-h-96 rounded-lg shadow-md p-4
  flex flex-col items-center justify-center
  fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border '
    >
      <div className='card-interview'>
        <div className='flex flex-col items-center text-center'>
          <img
            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`}
            alt='avatar'
            width={90}
            height={90}
            className='rounded-full object-fit size-[90px] bg-black outline hover:shadow-lg transition-transform transform hover:scale-125'
          />
          <h2 className='text-xl font-semibold mt-4'>Profile</h2>
          <h3 className='mt-5 capitalize'>User ID: {user?.uid || ''}</h3>
          <p className='text-gray-600 mt-4'>User Email : {user?.email}</p>

          <div>
            <form
              action={async () => {
                await signOut();
              }}
            >
              <Button
                type='submit'
                className='flex items-center gap-2 cursor-pointer mt-5'
              >
                <IoMdExit />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>

          <div className='mt-5 cursor-pointer'>
            <DeleteUserModal />
          </div>

          <Button onClick={() => router.back()} className='mt-7 cursor-pointer'>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
