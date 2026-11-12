'use client';

import RoleBadge, { GenderTag, ROLE_LABELS } from '@/components/common/RoleBadge';
import { MemberAddForm, MemberEditForm } from '@/components/features/settings/MemberForm';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { confirm } from '@/stores/confirm.store';
import type { TPlayer } from '@/types/player.types';
import { LoaderCircle, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useBoolean } from 'usehooks-ts';
import type { MemberDraft } from './schemas/member.schema';

interface RosterManagerProps {
  title?: string;
  roster: TPlayer[];
  loading: boolean;
  cloudOnline: boolean;
  /** Lưu toàn bộ danh sách mới lên Firestore. */
  onSave: (members: TPlayer[]) => Promise<void>;
}

export default function RosterManager({
  title = 'Thành viên cố định',
  roster,
  loading,
  cloudOnline,
  onSave,
}: RosterManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { value: saving, setTrue: startSaving, setFalse: stopSaving } = useBoolean(false);
  const [error, setError] = useState<string | null>(null);

  const maleCount = roster.filter((m) => m.gender === 'MALE').length;
  const femaleCount = roster.length - maleCount;
  const disabled = saving || !cloudOnline;

  /** Lưu danh sách mới. Trả về thông báo lỗi nếu thất bại, hoặc null nếu thành công. */
  async function persist(next: TPlayer[]): Promise<string | null> {
    startSaving();
    try {
      await onSave(next);
      return null;
    } catch (err) {
      return `Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      stopSaving();
    }
  }

  function isDuplicate(name: string, exceptId?: string) {
    const key = name.trim().toLowerCase();
    return roster.some((m) => m.id !== exceptId && m.name.trim().toLowerCase() === key);
  }

  async function handleAdd(values: MemberDraft): Promise<string | null> {
    if (isDuplicate(values.name)) return `"${values.name}" đã có trong danh sách.`;
    setError(null);
    const member: TPlayer = { id: crypto.randomUUID(), name: values.name, gender: values.gender, type: 'REGULAR' };
    return persist([...roster, member]);
  }

  function startEdit(member: TPlayer) {
    setEditingId(member.id);
    setError(null);
  }

  async function handleSaveEdit(id: string, values: MemberDraft): Promise<string | null> {
    const { name } = values;
    if (isDuplicate(name, id)) return `"${name}" đã có trong danh sách.`;
    const role = values.role || undefined;
    const previousHolder = role ? roster.find((m) => m.id !== id && m.role === role) : undefined;
    if (previousHolder && role) {
      const ok = await confirm({
        title: `Chuyển vai trò ${ROLE_LABELS[role]}?`,
        description: `"${previousHolder.name}" đang là ${ROLE_LABELS[role]}. Sau khi lưu, "${name}" sẽ là ${ROLE_LABELS[role]} và "${previousHolder.name}" trở về thành viên thường.`,
        confirmLabel: 'Chuyển vai trò',
      });
      if (!ok) return null; // Hủy chuyển vai trò: giữ nguyên form để chỉnh tiếp
    }
    // Mỗi vai trò chỉ 1 người: người đang giữ vai trò đó sẽ về thành viên thường.
    const next = roster.map((m) => {
      if (m.id === id) return { ...m, name, gender: values.gender, role };
      if (role && m.role === role) return { ...m, role: undefined };
      return m;
    });
    const message = await persist(next);
    if (!message) setEditingId(null);
    return message;
  }

  async function handleDelete(member: TPlayer) {
    const ok = await confirm({
      title: `Xóa "${member.name}"?`,
      description: 'Thành viên sẽ bị xóa khỏi danh sách cố định của nhóm. Lịch sử các buổi đã lưu không bị ảnh hưởng.',
      confirmLabel: 'Xóa',
      destructive: true,
    });
    if (!ok) return;
    setError(await persist(roster.filter((m) => m.id !== member.id)));
  }

  const leader = roster.find((m) => m.role === 'LEADER');
  const viceLeader = roster.find((m) => m.role === 'VICE_LEADER');

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {roster.length} người · {maleCount} nam · {femaleCount} nữ
        </CardDescription>
        {saving && (
          <CardAction>
            <LoaderCircle className="size-5 animate-spin text-primary" />
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <RoleBadge role="LEADER" /> {leader?.name ?? 'chưa có'}
          <RoleBadge role="VICE_LEADER" className="ml-2" /> {viceLeader?.name ?? 'chưa có'}
          <span className="basis-full">Bấm biểu tượng bút để đặt vai trò.</span>
        </div>

        <MemberAddForm disabled={disabled} onSubmit={handleAdd} />

        {!cloudOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        {loading ? (
          <p className="text-muted-foreground">Đang tải danh sách...</p>
        ) : roster.length === 0 ? (
          <p className="text-muted-foreground">Chưa có thành viên nào.</p>
        ) : (
          <ul className="divide-y">
            {roster.map((member, index) => (
              <li key={member.id} className="flex flex-wrap items-center gap-2 py-2 sm:flex-nowrap">
                <span className="w-6 text-right text-xs text-muted-foreground">{index + 1}.</span>
                {editingId === member.id ? (
                  <MemberEditForm
                    initial={{ name: member.name, gender: member.gender, role: member.role ?? '' }}
                    disabled={disabled}
                    onSubmit={(values) => handleSaveEdit(member.id, values)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate">{member.name}</span>
                      <RoleBadge role={member.role} />
                    </span>
                    <GenderTag gender={member.gender} />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sửa"
                      title="Sửa"
                      onClick={() => startEdit(member)}
                      disabled={disabled}
                      className="text-muted-foreground"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Xóa"
                      title="Xóa"
                      onClick={() => handleDelete(member)}
                      disabled={disabled}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
