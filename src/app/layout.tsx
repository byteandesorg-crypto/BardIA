import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'BARDIA — Plataforma para Entrenadores de Montaña y Running',
  description: 'Gestión centralizada de alumnos, registro de entrenamientos, métricas de rendimiento, análisis de evolución e informes profesionales para coaches.',
  keywords: ['running', 'trail running', 'entrenamiento', 'rendimiento deportivo', 'bardas', 'informes', 'métricas'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans bg-bardia-snow text-bardia-rock selection:bg-bardia-cyan/20 selection:text-bardia-blue">
        {children}
      </body>
    </html>
  );
}
