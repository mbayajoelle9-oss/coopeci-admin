import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata = {
  title: 'COOPECI-DC — Back-office',
  description: 'Administration de la Coopérative d\'Épargne, de Crédit et d\'Investissement Debout Congolais',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
