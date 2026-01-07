import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Korella CRM',
  description: 'Modern CRM platform for real estate professionals',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#0070f3',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
