'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/lib/actions/auth.action';
import {
  Bot,
  CalendarPlus,
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface UserMenuProps {
  name: string;
  email: string;
}

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/myprofile', label: 'My Profile', icon: UserIcon },
  { href: '/interview', label: 'Book Appointment', icon: CalendarPlus },
  { href: '/history', label: 'My Checkups', icon: History },
  { href: '/chat', label: 'AI Chatbot', icon: Bot },
];

// Seeded from the email so the same user always gets the same face.
const avatarUrl = (email: string, name: string) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
    email || name
  )}`;

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';

const UserMenu = ({ name, email }: UserMenuProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Dicebear is a third party — fall back to initials if it doesn't load.
  const [avatarFailed, setAvatarFailed] = useState(false);

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
      router.push('/sign-in');
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className='group flex items-center gap-3 rounded-full border border-white/10 bg-dark-200/60 py-1.5 pr-3 pl-1.5 cursor-pointer transition-colors hover:bg-dark-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-200 data-[state=open]:bg-dark-200'
      >
        <span className='flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-300 text-xs font-bold text-primary-200'>
          {avatarFailed ? (
            initials(name)
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl(email, name)}
              alt=''
              width={36}
              height={36}
              className='size-full object-cover'
              onError={() => setAvatarFailed(true)}
            />
          )}
        </span>

        <span className='hidden text-left leading-tight sm:block'>
          <span className='block max-w-[10rem] truncate text-sm font-semibold text-white'>
            {name}
          </span>
          <span className='block max-w-[10rem] truncate text-xs text-light-400'>
            {email}
          </span>
        </span>

        <ChevronDown
          size={16}
          aria-hidden='true'
          className='text-light-400 transition-transform duration-200 group-data-[state=open]:rotate-180'
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        sideOffset={8}
        className='w-60 border-white/10 bg-dark-200 p-1.5 text-light-100'
      >
        <DropdownMenuLabel className='px-2 pt-1.5 pb-2'>
          <span className='block truncate text-sm font-semibold text-white'>
            {name}
          </span>
          <span className='block truncate text-xs font-normal text-light-400'>
            {email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className='bg-white/10' />

        {links.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem
            key={href}
            asChild
            className='cursor-pointer rounded-md px-2 py-2 text-sm focus:bg-primary-200/15 focus:text-white [&_svg]:text-light-400 focus:[&_svg]:text-primary-200'
          >
            <Link href={href}>
              <Icon size={16} aria-hidden='true' />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className='bg-white/10' />

        <DropdownMenuItem
          variant='destructive'
          disabled={isPending}
          onSelect={(event) => {
            // Keep the menu mounted while the sign-out transition runs.
            event.preventDefault();
            handleSignOut();
          }}
          className='cursor-pointer rounded-md px-2 py-2 text-sm focus:bg-destructive/15'
        >
          <LogOut size={16} aria-hidden='true' />
          {isPending ? 'Signing out...' : 'Sign Out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
