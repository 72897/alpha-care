import { Separator } from '@/components/ui/separator';
import { Facebook, Github, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'AI Chatbot' },
  { href: '/history', label: 'My Checkups' },
  { href: '/myprofile', label: 'My Profile' },
];

const socials = [
  { href: 'https://github.com/72897', label: 'GitHub', Icon: Github },
  { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter },
  { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
  {
    href: 'https://www.linkedin.com/in/kunal-singh-454368289/',
    label: 'LinkedIn',
    Icon: Linkedin,
  },
  { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
];

// Static markup, so it renders once at build time rather than on every
// navigation through the authenticated layout.
const SiteFooter = () => (
  <footer className='bg-gray-950 text-gray-200 py-12 px-6 md:px-16 w-full'>
    <div className='max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8'>
      <div>
        <h4 className='text-xl font-bold mb-4 text-white'>About Alpha-Care</h4>
        <p className='text-sm leading-6 text-gray-400'>
          AlphaCare is an AI-driven healthcare assistant platform that helps
          users manage their medical needs, schedule appointments, receive
          personalized health insights, and access virtual consultations — all in
          one place.
        </p>
      </div>

      <div>
        <h4 className='text-xl font-bold mb-4 text-white'>Contact</h4>
        <p className='text-sm text-gray-400'>
          Email:{' '}
          <a
            href='mailto:kunalsingh203001@gmail.com'
            className='text-primary-500 hover:underline'
          >
            kunalsingh203001@gmail.com
          </a>
        </p>
        <p className='text-sm text-gray-400'>Phone: +91 94564 73642</p>
        <p className='text-sm text-gray-400'>Noida, Uttar Pradesh, India</p>
      </div>

      <div>
        <h4 className='text-xl font-bold mb-4 text-white'>Quick Links</h4>
        <ul className='space-y-2 text-sm'>
          {quickLinks.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className='hover:text-primary'>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className='text-xl font-bold mb-4 text-white'>Follow Us</h4>
        <div className='flex gap-4'>
          {socials.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={label}
              className='hover:text-primary transform translate-y-0 hover:-translate-y-1 transition-all duration-200'
            >
              <Icon size={22} aria-hidden='true' />
            </Link>
          ))}
        </div>
      </div>
    </div>

    <Separator className='my-8 bg-gray-700' />

    <div className='text-center text-sm text-gray-500'>
      © {new Date().getFullYear()} Alpha-Care. All rights reserved. Built with
      ❤️ by{' '}
      <a
        href='mailto:kunalsingh203001@gmail.com'
        className='hover:underline text-primary-500'
      >
        Team Alpha-care
      </a>
      .
    </div>
  </footer>
);

export default SiteFooter;
