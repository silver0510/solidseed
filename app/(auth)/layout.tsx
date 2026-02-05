import { AuthProvider } from '@/lib/auth/useAuth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-xl px-4 py-8 sm:px-10 border">
            {children}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SolidSeed CRM. All rights reserved.
          </p>
        </div>
      </div>
    </AuthProvider>
  );
}
