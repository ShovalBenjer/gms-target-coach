import { Target, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold">GMShooter</span>
        </Link>
        <div className="flex-1" />
        <Button asChild variant="ghost">
          <Link href="/dashboard">
            <User className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </header>
  );
}