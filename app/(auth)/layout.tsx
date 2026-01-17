import { AuthProvider } from '@/lib/auth/useAuth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl px-4 py-8 sm:px-10">
            {children}
          </div>
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Korella CRM. All rights reserved.
          </p>
        </div>
      </div>
    </AuthProvider>
  );
}
