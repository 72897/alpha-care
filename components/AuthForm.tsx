'use client';

import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { auth } from '@/firebase/Client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';

import { signIn, signUp } from '@/lib/actions/auth.action';
import FormField from './FormField';

function getFirebaseErrorMessage(error: unknown): string {
  const err = error as { code?: string; message?: string };
  const code = err?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in Firebase Console.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    default:
      if (typeof err?.message === 'string') {
        return err.message
          .replace(/^Firebase:\s*/i, '')
          .replace(/\(auth\/[^)]+\)\.?/i, '')
          .trim();
      }
      return 'An unexpected error occurred. Please try again.';
  }
}

const authFormSchema = (type: FormType) => {
  return z.object({
    name:
      type === 'sign-up'
        ? z.string().min(3, 'Name must be at least 3 characters')
        : z.string().optional(),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === 'sign-up') {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success('Account created successfully. Please sign in.');
        router.push('/sign-in');
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error('Sign in Failed. Please try again.');
          return;
        }

        const result = await signIn({
          email,
          idToken,
        });

        if (result && !result.success) {
          toast.error(result.message);
          return;
        }

        toast.success('Signed in successfully.');
        // The dashboard was rendered for a signed-out visitor before this, so
        // its cached entry is a redirect to /sign-in. Without the refresh the
        // router can replay that and bounce straight back here.
        router.replace('/');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      const friendlyMessage = getFirebaseErrorMessage(error);
      toast.error(friendlyMessage);
    }
  };

  const isSignIn = type === 'sign-in';

  return (
    <div className='card-border lg:min-w-[566px]'>
      <div className='flex flex-col gap-6 card py-14 px-10'>
        <div className='flex flex-row gap-2 justify-center'>
          <Image src='/logo.svg' alt='logo' height={32} width={38} />
          <h2 className='text-primary-100'>Buddhimaan AI</h2>
        </div>

        <h3>Check Your Health Status With AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='w-full space-y-6 mt-4 form'
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name='name'
                label='Name'
                placeholder='Your Name'
                type='text'
              />
            )}

            <FormField
              control={form.control}
              name='email'
              label='Email'
              placeholder='Your email address'
              type='email'
            />

            <FormField
              control={form.control}
              name='password'
              label='Password'
              placeholder='Enter your password'
              type='password'
            />

            <Button
              className='btn'
              type='submit'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? isSignIn
                  ? 'Signing in...'
                  : 'Creating account...'
                : isSignIn
                ? 'Sign In'
                : 'Create an Account'}
            </Button>
          </form>
        </Form>

        <p className='text-center'>
          {isSignIn ? 'No account yet?' : 'Have an account already?'}
          <Link
            href={!isSignIn ? '/sign-in' : '/sign-up'}
            className='font-bold text-user-primary ml-1'
          >
            {!isSignIn ? 'Sign In' : 'Sign Up'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
