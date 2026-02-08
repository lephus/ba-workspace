export const metadata = {
  title: 'BAWS - Business Analysis Workspace',
  description: 'BAWS Frontend',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
