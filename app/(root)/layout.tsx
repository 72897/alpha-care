import SiteFooter from '@/components/SiteFooter';
import UserMenu from '@/components/ui/UserMenu';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { getCurrentUser } from '@/lib/session';

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  return (
    <div className='root-layout'>
      <nav className='flex items-center justify-between px-6 py-4 shadow-sm'>
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src='/logo.svg'
            alt='Alpha-Care Logo'
            width={38}
            height={32}
            priority
          />
          <h2 className='text-xl font-semibold text-primary'>Alpha-Care</h2>
        </Link>

        <UserMenu name={user.name} email={user.email} />
      </nav>

      <main className='p-6'>{children}</main>

      <SiteFooter />
    </div>
  );
};

export default Layout;
