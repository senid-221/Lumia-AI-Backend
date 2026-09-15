import './globals.css';

export const metadata = {
  title: 'Lumia AI — AI Employee for Modern Business',
  description: 'Manage customers, conversations, products and commerce with Lumia AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
