import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CozyLogo from '../CozyLogo';

describe('CozyLogo Component', () => {
  it('기본 horizontal 모드에서 로고 텍스트와 서브타이틀이 렌더링되어야 한다', () => {
    render(<CozyLogo variant="horizontal" />);

    expect(screen.getByText('Cozy Book Club')).toBeInTheDocument();
    expect(screen.getByText(/숲속의 북클럽/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '코지 북클럽 심볼 로고' })).toBeInTheDocument();
  });

  it('full 모드에서 메인 헤딩과 서브타이틀이 정상 렌더링되어야 한다', () => {
    render(<CozyLogo variant="full" size="lg" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cozy Book Club');
    expect(screen.getByText(/숲속의 북클럽/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '코지 북클럽 심볼 로고' })).toBeInTheDocument();
  });

  it('icon 모드에서는 텍스트 없이 SVG 심볼만 렌더링되어야 한다', () => {
    render(<CozyLogo variant="icon" size="sm" />);

    expect(screen.queryByText('Cozy Book Club')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '코지 북클럽 심볼 로고' })).toBeInTheDocument();
  });

  it('showSubtitle=false 시 보조 텍스트가 표시되지 않아야 한다', () => {
    render(<CozyLogo variant="horizontal" showSubtitle={false} />);

    expect(screen.getByText('Cozy Book Club')).toBeInTheDocument();
    expect(screen.queryByText(/숲속의 북클럽/)).not.toBeInTheDocument();
  });
});
