import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700', '800'] });

export const metadata = {
  title: 'COOPECI-DC — Back-office',
  description: 'Administration de la Coopérative d\'Épargne, de Crédit et d\'Investissement Debout Congolais',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
