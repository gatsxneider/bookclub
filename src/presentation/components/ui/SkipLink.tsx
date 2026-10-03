/** 키보드 사용자가 반복되는 내비게이션을 건너뛰고 본문으로 이동하는 링크 (KWCAG 6.4.1) */
export function SkipLink({ href = '#main-content' }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-on-primary focus:font-semibold focus:shadow-lg"
    >
      본문 바로가기
    </a>
  );
}

export default SkipLink;
