import { QueryProvider } from '@/lib/query/QueryProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-white">
        {/* TODO: Add sidebar and header in User Authentication epic */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </QueryProvider>
  );
}
