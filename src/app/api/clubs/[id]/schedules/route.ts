import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { getOptionalUserId, requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';
import { createScheduleSchema, updateScheduleSchema } from '@/application/validation/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const viewerId = await getOptionalUserId(req);
    const schedules = await container.scheduleUseCases.getSchedules(params.id, viewerId);
    return NextResponse.json({ schedules });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json();
    const validated = createScheduleSchema.parse({
      ...body,
      club_id: params.id,
    });

    const schedule = await container.scheduleUseCases.createSchedule(params.id, userId, validated);
    return NextResponse.json({ success: true, schedule }, { status: 201 });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json();
    const validated = updateScheduleSchema.parse(body);

    const schedule = await container.scheduleUseCases.updateSchedule(params.id, userId, validated);
    return NextResponse.json({ success: true, schedule });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get('scheduleId') || searchParams.get('schedule_id');
    if (!scheduleId) {
      return NextResponse.json({ error: '삭제할 일정 ID가 필요합니다.' }, { status: 400 });
    }

    await container.scheduleUseCases.deleteSchedule(params.id, userId, scheduleId);
    return NextResponse.json({ success: true });
  });
}
