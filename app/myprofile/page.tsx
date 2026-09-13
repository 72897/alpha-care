import ProfileView from '@/components/ProfileView';
import { getProfilePageData } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';

// Server component: the data is fetched during the render, so the page arrives
// populated instead of shipping a loader and then firing four server actions
// from the client.
const Page = async () => {
  const { user, stats, latestReport, history } = await getProfilePageData();
  if (!user) redirect('/sign-in');

  return (
    <ProfileView
      user={user}
      stats={stats}
      latestReport={latestReport}
      history={history}
    />
  );
};

export default Page;
