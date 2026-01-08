import { AuthProvider } from '@/lib/auth/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={false}>
      <AuthProvider>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-xl px-4 py-8 sm:px-10">
              {children}
            </div>
            <p className="mt-6 text-center text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Korella CRM. All rights reserved.
            </p>
          </div>
        </div>
      </AuthProvider>
    </AuthGuard>
  );
}
