# History Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Màn hình Lịch sử (`/history`) chỉ tải đầy đủ dữ liệu (toàn bộ cột + người chơi) của các tháng đang hiển thị, tải thêm theo từng đợt tháng bằng nút "Xem thêm". Mọi con số trên màn hình (chip lọc, header tháng) vẫn chính xác trên toàn bộ dữ liệu.

**Architecture:** Tách dữ liệu nhẹ và dữ liệu nặng thành 2 loại query TanStack:

- `['sessions', 'summary']`: mọi buổi chơi nhưng chỉ vài cột (`id, group_id, group_name, iso_date, created_at, total_cost, session_players(rounded_payable, paid_method)`). Dùng để tính số trên chip lọc, header tháng (số buổi, tổng tiền, tiền chưa thu), danh sách tháng có dữ liệu, và số buổi của từng nhóm ở tab Nhóm.
- `['sessions', 'month', 'yyyy-MM']`: toàn bộ dữ liệu của 1 tháng (`select('*, session_players(*)')` lọc theo khoảng `iso_date`). Mỗi tháng 1 cache riêng.

Bộ lọc (theo nhóm, "Chưa thu đủ") vẫn chạy ở client. Query tóm tắt cho biết tháng nào có buổi khớp bộ lọc nên app bỏ qua các tháng không có kết quả. Mỗi đợt tải thêm các tháng liên tiếp cho tới khi đủ khoảng 10 buổi, không bao giờ cắt ngang một tháng.

**Không cần thay đổi Supabase** ở giai đoạn 1. Giai đoạn 2 (index + `rpc`) là tùy chọn, làm khi được phép đổi database.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TanStack React Query, Supabase (PostgREST), Tailwind CSS v4.

## Bối cảnh (hiện trạng tại thời điểm viết plan)

- `SessionApi.fetchAll()` tải toàn bộ `sessions` kèm `session_players(*)` trong 1 request, sắp theo `created_at desc`.
- `useHistoryPage` tính mọi thứ ở client trên toàn bộ dữ liệu: `groupSessionsByMonth` (sắp theo `iso_date desc, created_at desc`), `filterSessionsByGroup`, `buildGroupFilterOptions`, `getPaymentSummary`.
- `useGroupsPage` và `useGroupDetailPage` cũng gọi `useQuerySessions()` chỉ để đếm "N buổi đã lưu".
- `useMutateUpdatePayments` và `useMutateDeleteSession` cập nhật optimistic vào cache `['sessions']` (kiểu `TSession[]`).
- `['sessions']` được invalidate khi lưu buổi chơi (`useMutateSaveSession`), xóa sân (`useMutateDeleteCourt`) và xóa loại cầu (`useMutateDeleteShuttlecock`).
- Dữ liệu thật: 2 buổi (cùng tháng 11/2026), 15 người chơi, payload ~8KB (~4KB/buổi).

## Vì sao không dùng `.range()` đơn giản

1. Một tháng có thể bị cắt giữa 2 trang, header tháng sẽ chỉ tính tổng trên phần đã tải.
2. Chip "Tất cả (N)", số buổi từng nhóm và "Chưa thu đủ (N)" cần đếm trên toàn bộ dữ liệu.
3. "Chưa thu đủ" phụ thuộc `session_players`; PostgREST trên Supabase không bật hàm gộp (`sum`, `count`) nên không lọc/đếm được ở server nếu không đổi database.

## Global Constraints

- Tuân thủ `AGENTS.md`: không sửa `src/components/ui/`; `page.tsx` chỉ là UI; state/handler nằm trong `useHistoryPage`; hàm thuần nằm trong `src/app/history/utils/`; query hook dùng chung nằm trong `src/hooks/`.
- Không thêm mapper đổi tên field; type mới chỉ là `Pick`/alias từ `Tables<'sessions'>` / `Tables<'session_players'>`.
- Trạng thái offline (`!cloudOnline`) vẫn disable các thao tác ghi như hiện tại.
- Kiểm tra trước khi hoàn thành: `npx next typegen && npx tsc --noEmit -p .`, `pnpm lint`, `pnpm format`.

## Review Focus

- Header tháng và số trên chip phải khớp tuyệt đối với dữ liệu thật, kể cả khi bật bộ lọc và khi mới tải một phần.
- Optimistic update (đánh dấu đã thu, hoàn tác, đánh dấu tất cả, xóa buổi) phải sửa **cả** cache tháng lẫn cache tóm tắt, và rollback cả hai khi lỗi.
- Đổi bộ lọc không gây tải lại các tháng đã có trong cache.
- Lưu buổi chơi mới ở `/calculator` rồi quay lại `/history` phải thấy buổi mới (invalidate tiền tố `['sessions']`).
- Trạng thái trống (`HistoryEmpty`, `HistoryAllSettled`) không bị nháy khi các tháng đang tải.

---

### Task 1: Tầng dữ liệu

**Files:**

- Modify: `src/types/session.type.ts`
- Modify: `src/libs/supabase/api/session.api.ts`

**Steps:**

- [ ] 1. Thêm type `TSessionSummary = Pick<Tables<'sessions'>, 'id' | 'group_id' | 'group_name' | 'iso_date' | 'created_at' | 'total_cost'> & { session_players: Pick<TSessionPlayer, 'rounded_payable' | 'paid_method'>[] }`.
- [ ] 2. Thêm `SessionApi.fetchSummaries(): Promise<TSessionSummary[]>` với `select('id, group_id, group_name, iso_date, created_at, total_cost, session_players(rounded_payable, paid_method)')`.
- [ ] 3. Thêm `SessionApi.fetchMonth(monthStart: string, nextMonthStart: string): Promise<TSession[]>`: `select('*, session_players(*)')`, `.gte('iso_date', monthStart).lt('iso_date', nextMonthStart)`, sắp `iso_date desc, created_at desc`, người chơi theo `position asc` (giữ như `fetchAll`).
- [ ] 4. Giữ `fetchAll()` cho tới Task 5, sau đó xóa nếu không còn chỗ gọi.

---

### Task 2: Hàm thuần của màn Lịch sử

**Files:**

- Modify: `src/app/history/utils/payment.ts`
- Modify: `src/app/history/utils/filter.ts`
- Modify: `src/app/history/utils/month.ts`

**Steps:**

- [ ] 1. `payment.ts`: đổi tham số `getPaymentSummary` / `needsPayment` sang kiểu hẹp (`{ session_players: Pick<TSessionPlayer, 'rounded_payable' | 'paid_method'>[] }`) để dùng được cho cả `TSession` và `TSessionSummary`. `unpaidPlayerIds` giữ `TSession` (cần `player_id`).
- [ ] 2. `filter.ts`: đổi `sessionGroupName`, `buildGroupFilterOptions`, `filterSessionsByGroup` sang kiểu hẹp `Pick<TSession, 'group_id' | 'group_name'>` (generic `<T extends ...>` cho hàm trả về mảng).
- [ ] 3. `month.ts`: thêm `monthKeyOf(isoDate)` và `monthRange(key) => { start, nextStart }` ('yyyy-MM-dd').
- [ ] 4. `month.ts`: thêm `buildMonthIndex(summaries: TSessionSummary[]): TMonthSummary[]` (đã lọc sẵn bên ngoài), mỗi phần tử `{ key, label, count, total, outstanding }`, tháng mới nhất trước. Tách phần tính header ra khỏi `groupSessionsByMonth`.
- [ ] 5. `month.ts`: thêm `pickMonthBatch(index: TMonthSummary[], shownMonths: number, target = 10): number` trả về số tháng cần hiển thị sau khi tải thêm 1 đợt (cộng dồn `count` tới khi ≥ `target`, tối thiểu 1 tháng).
- [ ] 6. `groupSessionsByMonth` chỉ còn nhiệm vụ gom/sắp buổi chơi đầy đủ trong các tháng đã tải (header lấy từ `buildMonthIndex`).

---

### Task 3: Query hook dùng chung

**Files:**

- Modify: `src/hooks/useQuerySessions.ts`

**Steps:**

- [ ] 1. Thêm `useQuerySessionSummaries()`: key `['sessions', 'summary']`, `initialData: []`, `initialDataUpdatedAt: 0` (giống các query khác).
- [ ] 2. Thêm `useQuerySessionMonths(monthKeys: string[])`: `useQueries` với key `['sessions', 'month', key]`, `queryFn` gọi `SessionApi.fetchMonth(...monthRange(key))`. Trả về `{ sessions, pendingKeys, error }`.
- [ ] 3. `useMutateUpdatePayments`: trong `onMutate`, `cancelQueries({ queryKey: ['sessions'] })`, chụp lại và sửa optimistic **cả** `['sessions', 'month', monthKeyOf(...)]` (cần truyền thêm `isoDate` vào input) **và** `['sessions', 'summary']`. `onError` trả lại cả hai.
- [ ] 4. `useMutateDeleteSession`: tương tự, bỏ buổi khỏi cache tháng và cache tóm tắt; rollback cả hai khi lỗi. Input đổi thành `{ id, isoDate }`.
- [ ] 5. Giữ nguyên các invalidate `['sessions']` hiện có (tiền tố, tự làm mới cả summary và các tháng đã tải).

---

### Task 4: Hook và page của màn Lịch sử

**Files:**

- Modify: `src/app/history/hooks/useHistoryPage.ts`
- Modify: `src/app/history/page.tsx`
- Modify: `src/app/history/components/HistoryEmptyStates.tsx` (nếu cần skeleton cho phần đang tải thêm)

**Steps:**

- [ ] 1. `useHistoryPage`: thay `useQuerySessions()` bằng `useQuerySessionSummaries()`. Tính `filterOptions`, `totalCount`, `unsettledCount` từ summaries (dùng hàm ở Task 2).
- [ ] 2. Áp bộ lọc (nhóm, "Chưa thu đủ") lên summaries → `buildMonthIndex` → `monthIndex`.
- [ ] 3. State `shownMonths` (số tháng đang hiển thị), khởi tạo bằng `pickMonthBatch(monthIndex, 0)`; reset về đợt đầu khi đổi bộ lọc. `loadMore()` gọi `pickMonthBatch(monthIndex, shownMonths)`.
- [ ] 4. Gọi `useQuerySessionMonths(monthIndex.slice(0, shownMonths).map((m) => m.key))`; áp lại bộ lọc trên buổi đầy đủ rồi gom theo tháng. Header mỗi tháng lấy từ `monthIndex`.
- [ ] 5. Trả thêm `hasMore`, `remainingCount`, `loadingMore`, `loadMore`. Truyền `isoDate` vào `updatePayments` / `deleteSession`.
- [ ] 6. `refresh()` invalidate tiền tố `['sessions']` + refetch groups.
- [ ] 7. `page.tsx`: thêm nút "Xem thêm (còn N buổi)" ở cuối danh sách; hiện skeleton dưới tháng cuối khi `loadingMore`. Trạng thái trống dựa vào summaries.

---

### Task 5: Tab Nhóm dùng query tóm tắt

**Files:**

- Modify: `src/app/settings/groups/hooks/useGroupsPage.ts`
- Modify: `src/app/settings/groups/hooks/useGroupDetailPage.ts`

**Steps:**

- [ ] 1. Thay `useQuerySessions()` bằng `useQuerySessionSummaries()`; đếm số buổi theo `group_id` như cũ.
- [ ] 2. Xóa `useQuerySessions` và `SessionApi.fetchAll` nếu không còn chỗ dùng (`grep -rn "useQuerySessions\b\|fetchAll" src`).

---

### Task 6: Kiểm thử, tài liệu

**Files:**

- Modify: `.agents/ARCHITECTURE.md`

**Steps:**

- [ ] 1. Chạy `npx next typegen && npx tsc --noEmit -p .`, `pnpm lint`, `pnpm format`.
- [ ] 2. Kiểm thử bằng Playwright ở desktop và mobile: tải lần đầu, "Xem thêm", đổi bộ lọc qua lại, đánh dấu đã thu + hoàn tác, đánh dấu tất cả, xóa buổi, lưu buổi mới ở `/calculator` rồi quay lại `/history`.
- [ ] 3. Kiểm tra header tháng và số trên chip khớp với dữ liệu thật trong mọi tổ hợp bộ lọc.
- [ ] 4. Cập nhật phần data flow trong `.agents/ARCHITECTURE.md`: 2 loại cache key, optimistic update trên cả hai, chỗ tab Nhóm dùng summaries.

---

### Giai đoạn 2 (tùy chọn, khi được đổi database)

- [x] 1. Index: không cần thêm. Schema đã có `sessions_iso_date (iso_date desc, created_at desc)`, `sessions_group_id (group_id)`, và khóa chính `session_players (session_id, player_id)` đã phủ cột `session_id` (xem `supabase/migrations/20261119093409_init_schema.sql`).
- [ ] 2. Thêm hàm `rpc session_history_summary(p_group_id uuid default null)` trả về số buổi theo nhóm, số buổi chưa thu đủ, và theo từng tháng `{ month, count, total, outstanding }`. Thay `fetchSummaries()` bằng hàm này để query tóm tắt không lớn dần theo số buổi.
- [ ] 3. Chạy `pnpm db:types`, chỉ sửa tầng API và `useQuerySessionSummaries` (giữ hình dạng dữ liệu trả về cho hook ở Task 4).

---

## Câu hỏi mở (cần trả lời trước khi bắt đầu)

1. **Số lượng dữ liệu:** CLB chơi mấy buổi mỗi tuần, có bao nhiêu nhóm? Mục tiêu là sửa chỗ đang chậm (ví dụ trên 4G) hay chuẩn bị trước?
2. **Cách tải thêm:** nút "Xem thêm" (đề xuất) hay tự tải khi cuộn tới cuối?
3. **Kích thước mỗi đợt:** khoảng 10 buổi, làm tròn theo tháng, có ổn không?
4. **Header tháng** luôn đúng tổng của cả tháng, kể cả khi bật bộ lọc: xác nhận đây là yêu cầu.
5. ~~**Kiểu cột `iso_date`**~~ Đã trả lời: cột là `date` (`iso_date date not null`), nên lọc theo khoảng ngày luôn đúng và không có ngày sai định dạng.
6. **Dữ liệu kiểm thử:** dùng Supabase local (`npx supabase start`). Viết `supabase/seed.sql` với dữ liệu giả có buổi chơi ở nhiều tháng, nạp bằng `npx supabase db reset`. Cần xác nhận: có được reset DB local (mất dữ liệu local hiện có, đã backup trong `supabase/backups/`) không?
7. **Giai đoạn 2:** sau này có cho phép thêm index và hàm `rpc` trên Supabase không? Nếu có, giữ `TSessionSummary` ổn định để lúc chuyển chỉ phải sửa tầng API.
