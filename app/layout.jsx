import './globals.css';

export const metadata = {
  title: 'ContrarIA | Consejo de debate para ideas de negocio',
  description:
    'ContrarIA contrasta una idea de negocio con un consejo de especialistas de IA.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
