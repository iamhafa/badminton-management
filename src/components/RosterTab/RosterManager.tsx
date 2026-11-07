'use client';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { Gender, MemberRole, Player } from '@/types/badminton';
import { randomUUID } from 'crypto';
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '../../hooks/useConfirm';
import RoleBadge, { GenderTag, ROLE_LABELS } from '../RoleBadge';

type Draft = { name: string; gender: Gender; role: MemberRole | '' };

interface RosterManagerProps {
	roster: Player[];
	loading: boolean;
	cloudOnline: boolean;
	/** Lưu toàn bộ danh sách mới lên Firestore. */
	onSave: (members: Player[]) => Promise<void>;
}

export default function RosterManager({ roster, loading, cloudOnline, onSave }: RosterManagerProps) {
	const [newName, setNewName] = useState('');
	const [newGender, setNewGender] = useState<Gender>('MALE');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState<Draft>({ name: '', gender: 'MALE', role: '' });
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { confirm, confirmDialog } = useConfirm();

	const maleCount = roster.filter((m) => m.gender === 'MALE').length;
	const femaleCount = roster.length - maleCount;
	const disabled = saving || !cloudOnline;

	async function persist(next: Player[]): Promise<boolean> {
		setSaving(true);
		setError(null);
		try {
			await onSave(next);
			return true;
		} catch (err) {
			setError(`Lưu thất bại: ${err instanceof Error ? err.message : String(err)}`);
			return false;
		} finally {
			setSaving(false);
		}
	}

	function isDuplicate(name: string, exceptId?: string) {
		const key = name.trim().toLowerCase();
		return roster.some((m) => m.id !== exceptId && m.name.trim().toLowerCase() === key);
	}

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		if (isDuplicate(name)) {
			setError(`"${name}" đã có trong danh sách.`);
			return;
		}
		const member: Player = { id: randomUUID(), name, gender: newGender, type: 'REGULAR' };
		if (await persist([...roster, member])) setNewName('');
	}

	function startEdit(member: Player) {
		setEditingId(member.id);
		setDraft({ name: member.name, gender: member.gender, role: member.role ?? '' });
		setError(null);
	}

	async function handleSaveEdit(id: string) {
		const name = draft.name.trim();
		if (!name) return;
		if (isDuplicate(name, id)) {
			setError(`"${name}" đã có trong danh sách.`);
			return;
		}
		const role = draft.role || undefined;
		const previousHolder = role ? roster.find((m) => m.id !== id && m.role === role) : undefined;
		if (previousHolder && role) {
			const ok = await confirm({
				title: `Chuyển vai trò ${ROLE_LABELS[role]}?`,
				description: `"${previousHolder.name}" đang là ${ROLE_LABELS[role]}. Sau khi lưu, "${name}" sẽ là ${ROLE_LABELS[role]} và "${previousHolder.name}" trở về thành viên thường.`,
				confirmLabel: 'Chuyển vai trò',
			});
			if (!ok) return;
		}
		// Mỗi vai trò chỉ 1 người: người đang giữ vai trò đó sẽ về thành viên thường.
		const next = roster.map((m) => {
			if (m.id === id) return { ...m, name, gender: draft.gender, role };
			if (role && m.role === role) return { ...m, role: undefined };
			return m;
		});
		if (await persist(next)) setEditingId(null);
	}

	async function handleDelete(member: Player) {
		const ok = await confirm({
			title: `Xóa "${member.name}"?`,
			description: 'Thành viên sẽ bị xóa khỏi danh sách cố định. Lịch sử các buổi đã lưu không bị ảnh hưởng.',
			confirmLabel: 'Xóa',
			destructive: true,
		});
		if (!ok) return;
		await persist(roster.filter((m) => m.id !== member.id));
	}

	const leader = roster.find((m) => m.role === 'LEADER');
	const viceLeader = roster.find((m) => m.role === 'VICE_LEADER');

	return (
		<Card className="mx-auto w-full max-w-2xl">
			<CardHeader>
				<CardTitle>Thành viên cố định CLB</CardTitle>
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

				<form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
					<Input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="Tên thành viên"
						aria-label="Tên thành viên mới"
						className="min-w-0 flex-1"
					/>
					<div className="flex gap-2">
						<GenderSelect value={newGender} onChange={setNewGender} />
						<Button type="submit" disabled={disabled || !newName.trim()}>
							<Plus /> Thêm
						</Button>
					</div>
				</form>

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
									<>
										<Input
											value={draft.name}
											autoFocus
											aria-label="Tên thành viên"
											onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
											onKeyDown={(e) => {
												if (e.key === 'Enter') handleSaveEdit(member.id);
												if (e.key === 'Escape') setEditingId(null);
											}}
											className="min-w-0 flex-1"
										/>
										<GenderSelect value={draft.gender} onChange={(g) => setDraft((d) => ({ ...d, gender: g }))} />
										<NativeSelect
											value={draft.role}
											onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as Draft['role'] }))}
											aria-label="Vai trò"
										>
											<NativeSelectOption value="">Thành viên</NativeSelectOption>
											<NativeSelectOption value="LEADER">{ROLE_LABELS.LEADER}</NativeSelectOption>
											<NativeSelectOption value="VICE_LEADER">{ROLE_LABELS.VICE_LEADER}</NativeSelectOption>
										</NativeSelect>
										<Button
											variant="ghost"
											size="icon"
											aria-label="Lưu"
											title="Lưu"
											onClick={() => handleSaveEdit(member.id)}
											disabled={disabled}
											className="text-primary"
										>
											<Check />
										</Button>
										<Button variant="ghost" size="icon" aria-label="Hủy" title="Hủy" onClick={() => setEditingId(null)}>
											<X />
										</Button>
									</>
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
			{confirmDialog}
		</Card>
	);
}

function GenderSelect({ value, onChange }: { value: Gender; onChange: (g: Gender) => void }) {
	return (
		<NativeSelect value={value} onChange={(e) => onChange(e.target.value as Gender)} aria-label="Giới tính">
			<NativeSelectOption value="MALE">Nam</NativeSelectOption>
			<NativeSelectOption value="FEMALE">Nữ</NativeSelectOption>
		</NativeSelect>
	);
}
