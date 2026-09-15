import type { Metadata } from 'next';
import QueryProvider from '@/providers/QueryProvider';
import Navigation from '@/components/ui/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'RailRadar — Live Train Tracking & Smart Journey Companion',
  description: 'Real-time train tracking, immersive railway maps, journey analytics, and contextual travel insights across India.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F9FB] text-gray-900 pb-20 md:pb-8">
        <QueryProvider>
          <Navigation />
          <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
