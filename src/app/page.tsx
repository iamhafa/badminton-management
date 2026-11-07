'use client';

import BillSummaryCard from '@/components/CalculatorTab/BillSummaryCard';
import ParticipantSelector from '@/components/CalculatorTab/ParticipantSelector';
import SessionCostForm from '@/components/CalculatorTab/SessionCostForm';
import Header, { type CloudStatus, type TabKey } from '@/components/Header';
import HistoryList from '@/components/HistoryTab/HistoryList';
import RosterManager from '@/components/RosterTab/RosterManager';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { calculateBill } from '@/libs/calculator';
import { todayIso } from '@/libs/date-utils';
import { deleteSession, fetchRoster, fetchSessions, saveRoster, saveSession } from '@/libs/firebase';
import { ORGANIZER_ID, type Gender, type Player, type SessionBill, type SessionInput } from '@/types/badminton';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

const DEFAULT_INPUT: Omit<SessionInput, 'isoDate'> = {
	hoursPlayed: 2,
	courtFee: 280000,
	shuttleBrand: 'Thành Công',
	tubePrice: 300000,
	shuttlesUsed: 5,
	waterFee: 40000,
	waterPayerId: ORGANIZER_ID,
	femaleCap: 50000,
};

const noopSubscribe = () => () => {};

/** true sau khi hydrate xong ở client (tránh lệch ngày giữa server UTC và trình duyệt). */
function useHydrated() {
	return useSyncExternalStore(
		noopSubscribe,
		() => true,
		() => false,
	);
}

function errorMessage(err: unknown) {
	return err instanceof Error ? err.message : String(err);
}

export default function Home() {
	const hydrated = useHydrated();
	const [activeTab, setActiveTab] = useState<TabKey>('calculator');
	const [cloudStatus, setCloudStatus] = useState<CloudStatus>('connecting');

	const [roster, setRoster] = useState<Player[]>([]);
	const [rosterLoading, setRosterLoading] = useState(true);

	const [sessions, setSessions] = useState<SessionBill[]>([]);
	const [sessionsLoading, setSessionsLoading] = useState(true);
	const [sessionsError, setSessionsError] = useState<string | null>(null);

	// isoDate rỗng = "hôm nay" (chỉ tính ở trình duyệt để không bị đóng băng lúc build).
	const [input, setInput] = useState<SessionInput>({ ...DEFAULT_INPUT, isoDate: '' });
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [guests, setGuests] = useState<Player[]>([]);

	// ---------- Firestore ----------

	const loadRoster = useCallback(() => {
		fetchRoster()
			.then((members) => {
				setRoster(members);
				setCloudStatus('online');
			})
			.catch((err) => {
				console.error('Không tải được danh sách thành viên:', err);
				setCloudStatus('offline');
			})
			.finally(() => setRosterLoading(false));
	}, []);

	const loadSessions = useCallback(() => {
		fetchSessions()
			.then((list) => {
				setSessions(list);
				setSessionsError(null);
			})
			.catch((err) => setSessionsError(`Không tải được lịch sử: ${errorMessage(err)}`))
			.finally(() => setSessionsLoading(false));
	}, []);

	useEffect(() => {
		loadRoster();
		loadSessions();
	}, [loadRoster, loadSessions]);

	function retryConnection() {
		setCloudStatus('connecting');
		setRosterLoading(true);
		setSessionsLoading(true);
		loadRoster();
		loadSessions();
	}

	function refreshSessions() {
		setSessionsLoading(true);
		loadSessions();
	}

	async function handleSaveRoster(members: Player[]) {
		await saveRoster(members);
		setRoster(members);
	}

	// ---------- Người tham gia ----------

	const participants = useMemo<Player[]>(() => {
		const selected = new Set(selectedIds);
		const regulars = roster
			.filter((m) => selected.has(m.id))
			.map((m) => ({ ...m, type: 'REGULAR' as const, active: true }));
		return [...regulars, ...guests];
	}, [roster, selectedIds, guests]);

	// Nếu người ứng nước bị bỏ chọn thì quay về "Người tổ chức".
	const effectiveInput = useMemo<SessionInput>(() => {
		const payerStillPlaying = participants.some((p) => p.id === input.waterPayerId);
		return {
			...input,
			isoDate: input.isoDate || (hydrated ? todayIso() : ''),
			waterPayerId: payerStillPlaying ? input.waterPayerId : ORGANIZER_ID,
		};
	}, [input, participants, hydrated]);

	const bill = useMemo(() => calculateBill(effectiveInput, participants), [effectiveInput, participants]);

	function toggleMember(id: string) {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	}

	function addGuest(name: string, gender: Gender) {
		setGuests((prev) => {
			const trimmed = name.trim();
			let guestName = trimmed;
			if (!guestName) {
				const maxNumber = prev.reduce((max, g) => {
					const match = /^Vãng lai (\d+)$/.exec(g.name.trim());
					return match ? Math.max(max, Number(match[1])) : max;
				}, 0);
				guestName = `Vãng lai ${maxNumber + 1}`;
			}
			return [...prev, { id: crypto.randomUUID(), name: guestName, gender, type: 'GUEST' }];
		});
	}

	function updateGuest(id: string, patch: Partial<Pick<Player, 'name' | 'gender'>>) {
		setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
	}

	function removeGuest(id: string) {
		setGuests((prev) => prev.filter((g) => g.id !== id));
	}

	/** Đưa form tính tiền về mặc định: ngày hôm nay, chi phí mặc định, bỏ chọn hết người chơi. */
	function resetCalculator() {
		setInput({ ...DEFAULT_INPUT, isoDate: '' });
		setSelectedIds([]);
		setGuests([]);
	}

	async function handleSaveSession() {
		const toSave: SessionBill = {
			...bill,
			createdAt: moment().toISOString(),
			playerBreakdowns: bill.playerBreakdowns.map((p) => ({ ...p, name: p.name.trim() || 'Không tên' })),
		};
		try {
			const id = await saveSession(toSave);
			setSessions((prev) => [{ ...toSave, id }, ...prev]);
			resetCalculator();
			toast.success(`Đã lưu buổi ${toSave.title} (${toSave.totalCount} người).`, {
				action: { label: 'Xem lịch sử', onClick: () => setActiveTab('history') },
			});
		} catch (err) {
			toast.error(`Lưu thất bại: ${errorMessage(err)}`);
		}
	}

	async function handleDeleteSession(id: string) {
		await deleteSession(id);
		setSessions((prev) => prev.filter((s) => s.id !== id));
	}

	const cloudOnline = cloudStatus === 'online';

	return (
		<Tabs
			value={activeTab}
			onValueChange={(value) => setActiveTab(value as TabKey)}
			className="flex min-h-full flex-1 flex-col gap-0 bg-[#f0f4f8]"
		>
			<Header cloudStatus={cloudStatus} onRetryConnection={retryConnection} rosterCount={roster.length} historyCount={sessions.length} />

			<main className="mx-auto w-full max-w-6xl flex-1 px-3 py-3.5 sm:px-4 sm:py-6">
				{!hydrated ? (
					<p className="text-sm text-muted-foreground">Đang tải...</p>
				) : (
					<>
						<TabsContent value="calculator">
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
								<div className="flex flex-col gap-4">
									<SessionCostForm
										input={effectiveInput}
										onChange={(patch) => setInput((prev) => ({ ...prev, ...patch }))}
										participants={participants}
									/>
									<ParticipantSelector
										roster={roster}
										rosterLoading={rosterLoading}
										selectedIds={selectedIds}
										onToggle={toggleMember}
										onSelectAll={() => setSelectedIds(roster.map((m) => m.id))}
										onClearAll={() => setSelectedIds([])}
										guests={guests}
										onAddGuest={addGuest}
										onUpdateGuest={updateGuest}
										onRemoveGuest={removeGuest}
										onNavigateRoster={() => setActiveTab('roster')}
									/>
								</div>
								<div>
									<BillSummaryCard bill={bill} onSave={handleSaveSession} cloudOnline={cloudOnline} />
								</div>
							</div>
						</TabsContent>

						<TabsContent value="roster">
							<RosterManager
								roster={roster}
								loading={rosterLoading}
								cloudOnline={cloudOnline}
								onSave={handleSaveRoster}
							/>
						</TabsContent>

						<TabsContent value="history">
							<HistoryList
								sessions={sessions}
								loading={sessionsLoading}
								error={sessionsError}
								cloudOnline={cloudOnline}
								onRefresh={refreshSessions}
								onDelete={handleDeleteSession}
							/>
						</TabsContent>
					</>
				)}
			</main>
		</Tabs>
	);
}
