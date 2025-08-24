import Link from 'next/link'
import { Button } from '@/components/ui/button'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
      <h1 className="text-6xl font-headline font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">Could not find the requested resource.</p>
      <Button asChild className="mt-6">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  )
}
