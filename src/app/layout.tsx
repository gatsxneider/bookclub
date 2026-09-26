import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '코지 독서 클럽 | 다정한 사람들의 온기 있는 서재',
  description: '추천 도서를 탐색하고 일정을 나누며 함께 독서와 독후감을 기록하는 코지 독서 커뮤니티',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
