import './style.css';
export const metadata = { title: 'Document Engine V4 | Next.js Studio', description: 'SQLite snapshot, relation ve computed örneği' };
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) {
  return <html lang="tr"><body>{children}</body></html>;
}
