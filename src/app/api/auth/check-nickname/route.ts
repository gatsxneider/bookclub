import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/server/validations';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawNickname = searchParams.get('nickname') || '';
    const nickname = sanitizeHtml(rawNickname.trim());

    if (!nickname) {
      return NextResponse.json(
        { available: false, message: '닉네임을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json(
        { available: false, message: '닉네임은 2자 이상 20자 이하로 입력해주세요.' },
        { status: 400 }
      );
    }

    // 허용된 문자: 한글, 영문, 숫자, 밑줄(_), 하이픈(-)
    const nicknameRegex = /^[가-힣a-zA-Z0-9_\-\s]+$/;
    if (!nicknameRegex.test(nickname)) {
      return NextResponse.json(
        { available: false, message: '닉네임에 특수문자는 사용할 수 없습니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 대소문자 무시 중복 조회
    const { data: existingUser, error } = await supabase
      .from('profiles')
      .select('id, nickname')
      .ilike('nickname', nickname)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Nickname check error:', error);
      // DB 에러 시 안전 처리
    }

    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: `'${nickname}'은(는) 이미 사용 중인 닉네임입니다.`,
      });
    }

    return NextResponse.json({
      available: true,
      message: '사용 가능한 닉네임입니다! ✨',
    });
  } catch (error: any) {
    return NextResponse.json(
      { available: false, message: error.message || '닉네임 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
