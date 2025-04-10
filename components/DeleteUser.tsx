'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteUser } from '@/lib/actions/auth.action'; // adjust the import path as needed
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function DeleteUserModal() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUser();
      if (res?.success) {
        router.push('/'); // redirect after deletion
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='destructive' className='mt-4'>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className='backdrop-blur-sm'>
        <DialogHeader>
          <DialogTitle>Delete Your Account?</DialogTitle>
          <DialogDescription>
            This action is irreversible and will permanently remove all your
            data.
          </DialogDescription>
        </DialogHeader>
        <div className='flex justify-end gap-2 mt-4'>
          <DialogClose asChild>
            <Button variant='secondary'>Cancel</Button>
          </DialogClose>

          <Button
            variant='destructive'
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
