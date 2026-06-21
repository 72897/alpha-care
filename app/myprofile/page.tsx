'use client';

import DeleteUserModal from '@/components/DeleteUser';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/Loading';
import { auth } from '@/firebase/Client';
import { signOut, getCurrentUser, updateUserProfile } from '@/lib/actions/auth.action';
import { getUserWellnessStats, getLatestUserFeedback, getUserFeedbackHistory } from '@/lib/actions/general.action';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { IoMdExit } from 'react-icons/io';
import { toast } from 'sonner';
import { Edit2, Award, Clipboard, ChevronLeft, User as UserIcon } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */
import TrendChart from '@/components/TrendChart';
import DownloadFeedbackPDF from '@/components/DownloadFeedback';
import Image from 'next/image';

type DbUser = {
  id: string;
  name: string;
  email: string;
  focusArea?: string;
};

const ProfileCard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string>('');
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [stats, setStats] = useState<{ avgScore: number; count: number }>({ avgScore: 0, count: 0 });
  const [latestReport, setLatestReport] = useState<Feedback | null>(null);
  const [history, setHistory] = useState<Feedback[]>([]);
  
  const [nameInput, setNameInput] = useState('');
  const [focusAreaInput, setFocusAreaInput] = useState('General Wellness');
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAvatarSeed(firebaseUser.email || firebaseUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfileData = async () => {
      const dbUserData = await getCurrentUser();
      if (dbUserData) {
        setDbUser(dbUserData);
        setNameInput(dbUserData.name || '');
        setFocusAreaInput(dbUserData.focusArea || 'General Wellness');
      }
      const statsData = await getUserWellnessStats();
      if (statsData) {
        setStats(statsData);
      }
      const reportData = await getLatestUserFeedback();
      if (reportData) {
        setLatestReport(reportData);
      }
      const historyData = await getUserFeedbackHistory();
      if (historyData) {
        setHistory(historyData);
      }
    };
    loadProfileData();
  }, [user]);

  if (!user || !dbUser) {
    return (
      <div className='flex items-center justify-center h-screen bg-black'>
        <Loader />
      </div>
    );
  }

  const handleSave = () => {
    if (!nameInput.trim()) {
      return toast.error('Name cannot be empty.');
    }
    startTransition(async () => {
      const res = await updateUserProfile({
        name: nameInput,
        focusArea: focusAreaInput,
      });
      if (res.success) {
        toast.success(res.message);
        setDbUser((prev) => prev ? { ...prev, name: nameInput, focusArea: focusAreaInput } : null);
        setIsEditing(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className='max-w-6xl mx-auto py-8 px-4 text-white space-y-6 min-h-[calc(100vh-140px)] flex flex-col gap-2'>
      
      {/* Top Header Card */}
      <div className='backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl'>
        <div className='flex flex-col md:flex-row items-center gap-5 text-center md:text-left'>
          <img
            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`}
            alt='avatar'
            width={90}
            height={90}
            className='rounded-full size-[90px] bg-white/10 p-1 shadow-lg border border-white/20'
          />
          <div>
            <div className='flex items-center gap-2 mb-1.5 justify-center md:justify-start'>
              <Image src='/logo.svg' alt='Alpha-Care Logo' width={26} height={22} />
              <span className='text-xs font-bold text-primary uppercase tracking-wider'>Alpha-Care</span>
            </div>
            <h2 className='text-3xl font-bold text-white'>Your Health Profile</h2>
            <p className='text-sm text-gray-300'>Manage your profile goals and review wellness insights</p>
          </div>
        </div>

        {/* Action Panel Buttons (Go Back, Sign Out) in header */}
        <div className='flex items-center gap-3 w-full md:w-auto justify-center'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            className='border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer px-4'
          >
            <ChevronLeft size={16} className='mr-1' />
            Go Back
          </Button>
          
          <form action={async () => { await signOut(); }}>
            <Button
              type='submit'
              className='bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition cursor-pointer px-4'
            >
              <IoMdExit className='text-lg' />
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Two half columns left and right on lg screens */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        
        {/* Left Half (Column span 5 on large) */}
        <div className='lg:col-span-5 space-y-6 flex flex-col'>
          
          {/* Main Details and Edit Form */}
          <div className='backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6'>
            <div className='flex items-center justify-between border-b border-white/10 pb-3'>
              <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                <UserIcon size={20} className='text-primary-200' />
                Account Information
              </h3>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant='outline'
                  className='border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer size-8 p-0 flex items-center justify-center'
                  title='Edit Profile'
                >
                  <Edit2 size={14} />
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className='space-y-4'>
                <div className='flex flex-col gap-2'>
                  <label className='text-xs font-semibold text-gray-300'>Full Name</label>
                  <input
                    type='text'
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className='bg-white/10 border border-white/15 focus:border-primary-200 focus:outline-none rounded-xl px-4 py-3 text-sm text-white w-full'
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='text-xs font-semibold text-gray-300'>Primary Health Goal</label>
                  <select
                    value={focusAreaInput}
                    onChange={(e) => setFocusAreaInput(e.target.value)}
                    className='bg-dark-200 border border-white/15 focus:border-primary-200 focus:outline-none rounded-xl px-4 py-3 text-sm text-white w-full'
                  >
                    <option value='General Wellness'>General Wellness</option>
                    <option value='Sleep Quality'>Improve Sleep</option>
                    <option value='Stress & Mental Wellness'>Reduce Stress</option>
                    <option value='Nutritional Balance'>Nutritional Balance</option>
                    <option value='Physical Activity'>Physical Fitness</option>
                  </select>
                </div>

                <div className='flex gap-3 pt-2'>
                  <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className='flex-1 !bg-primary-200 !text-dark-100 hover:!bg-primary-200/80 font-bold rounded-full cursor-pointer py-2.5'
                  >
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setNameInput(dbUser.name);
                      setFocusAreaInput(dbUser.focusArea || 'General Wellness');
                      setIsEditing(false);
                    }}
                    className='flex-1 border-white/20 text-white hover:bg-white/10 cursor-pointer py-2.5'
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='text-sm space-y-1 bg-white/5 p-4 rounded-xl border border-white/5'>
                  <span className='text-xs font-semibold text-gray-400 block'>Display Name</span>
                  <span className='font-bold text-white text-lg'>{dbUser.name || 'User'}</span>
                </div>

                <div className='text-sm space-y-1 bg-white/5 p-4 rounded-xl border border-white/5'>
                  <span className='text-xs font-semibold text-gray-400 block'>Focus Health Goal</span>
                  <span className='font-bold text-primary-200 text-lg'>{dbUser.focusArea || 'General Wellness'}</span>
                </div>

                <div className='text-sm space-y-1 bg-white/5 p-4 rounded-xl border border-white/5'>
                  <span className='text-xs font-semibold text-gray-400 block'>Account Email</span>
                  <span className='text-gray-200 font-semibold'>{user.email}</span>
                </div>

                <div className='text-sm space-y-1 bg-white/5 p-4 rounded-xl border border-white/5'>
                  <span className='text-xs font-semibold text-gray-400 block'>User ID</span>
                  <span className='text-xs font-mono text-gray-300 select-all'>{user.uid}</span>
                </div>
              </div>
            )}
          </div>

          {/* Wellness Statistics */}
          <div className='backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4'>
            <h3 className='text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3'>
              <Award size={20} className='text-primary-200' />
              Wellness Statistics
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4'>
                <div className='bg-yellow-500/20 p-3 rounded-xl text-yellow-400 border border-yellow-500/20'>
                  <Award size={24} />
                </div>
                <div>
                  <span className='text-xs uppercase font-bold text-gray-400 block'>Avg Score</span>
                  <span className='text-2xl font-bold text-white'>{stats.avgScore}/100</span>
                </div>
              </div>

              <div className='bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4'>
                <div className='bg-blue-500/20 p-3 rounded-xl text-blue-400 border border-blue-500/20'>
                  <Clipboard size={24} />
                </div>
                <div>
                  <span className='text-xs uppercase font-bold text-gray-400 block'>Completed</span>
                  <span className='text-2xl font-bold text-white'>{stats.count} logs</span>
                </div>
              </div>
            </div>
            
            <TrendChart history={history} />
          </div>

          {/* Account Deletion Panel */}
          <div className='backdrop-blur-md bg-red-950/20 border border-red-500/20 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4'>
            <div>
              <h4 className='text-lg font-bold text-red-400'>Danger Zone</h4>
              <p className='text-xs text-gray-400'>Permanently delete your profile and all checkup logs.</p>
            </div>
            <div className='w-full sm:w-auto text-center'>
              <DeleteUserModal />
            </div>
          </div>

        </div>

        {/* Right Half (Column span 7 on large) */}
        <div className='lg:col-span-7 h-full'>
          {latestReport ? (
            <div className='backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4'>
              <div className='flex items-center justify-between border-b border-white/10 pb-3'>
                <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                  <Clipboard size={20} className='text-primary-200' />
                  Latest Checkup Report Summary
                </h3>
                <DownloadFeedbackPDF interviewTitle="Latest Wellness Checkup" feedback={latestReport} />
              </div>
              <div className='space-y-4'>
                <div className='flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5'>
                  <div>
                    <span className='text-xs font-semibold text-gray-400 block'>Latest Overall Score</span>
                    <span className='text-2xl font-black text-primary-200'>{latestReport.totalScore} / 100</span>
                  </div>
                  <span className='text-sm text-gray-400 font-semibold bg-white/10 px-3 py-1.5 rounded-full'>
                    {new Date(latestReport.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                
                <div className='space-y-3.5'>
                  <span className='text-sm font-bold text-gray-300 block'>Wellness Area Metrics:</span>
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                    {latestReport.categoryScores?.map((cat) => (
                      <div key={cat.name} className='bg-white/5 border border-white/5 p-3 rounded-xl flex justify-between items-center text-sm hover:bg-white/10 transition-colors duration-150'>
                        <span className='text-gray-300'>{cat.name}</span>
                        <span className='font-bold text-primary-200'>{cat.score}/100</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
                  <div className='bg-green-500/10 border border-green-500/20 p-4 rounded-xl space-y-2.5'>
                    <span className='text-xs font-bold uppercase tracking-wider text-green-400 block'>Key Strengths</span>
                    <ul className='list-disc list-inside text-xs space-y-1.5 text-green-100 leading-5'>
                      {latestReport.strengths?.map((str, idx) => <li key={idx} className='list-item'>{str}</li>)}
                    </ul>
                  </div>
                  <div className='bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl space-y-2.5'>
                    <span className='text-xs font-bold uppercase tracking-wider text-yellow-400 block'>Areas for Improvement</span>
                    <ul className='list-disc list-inside text-xs space-y-1.5 text-yellow-100 leading-5'>
                      {latestReport.areasForImprovement?.map((imp, idx) => <li key={idx} className='list-item'>{imp}</li>)}
                    </ul>
                  </div>
                </div>

                <div className='bg-white/5 border border-white/5 p-4 rounded-xl space-y-2.5'>
                  <span className='text-xs font-bold uppercase tracking-wider text-primary-200 block'>Final Clinical Assessment</span>
                  <p className='text-sm leading-6 text-gray-200 whitespace-pre-wrap'>{latestReport.finalAssessment}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className='backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-400 shadow-xl min-h-[300px] flex flex-col items-center justify-center'>
              <Clipboard className='size-12 mb-4 text-gray-500' />
              <h3 className='text-lg font-bold text-white mb-2'>No Checkup History Yet</h3>
              <p className='text-sm max-w-md'>Complete your first virtual wellness checkup to view your full summary and report insights here!</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ProfileCard;
