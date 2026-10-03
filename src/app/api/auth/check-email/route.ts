import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/supabase/serverClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { available: false, exists: false, message: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { available: false, exists: false, message: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // profiles 테이블에서 이메일 중복 조회
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Email check error:', error);
    }

    if (existingProfile) {
      return NextResponse.json({
        available: false,
        exists: true,
        message: '이미 가입된 회원입니다.',
      });
    }

    return NextResponse.json({
      available: true,
      exists: false,
      message: '가입 가능한 이메일입니다.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { available: false, exists: false, message: error.message || '이메일 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
