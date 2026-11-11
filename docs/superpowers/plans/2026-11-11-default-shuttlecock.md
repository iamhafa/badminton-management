# Default TShuttlecock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép đặt 1 loại quả cầu lông làm mặc định tại trang Cài đặt loại cầu (`/settings/shuttlecocks`), và tự động chọn loại cầu này khi vào màn hình Tính tiền (`/`).

**Architecture:**

- Thêm cờ `isDefault?: boolean` vào model và schema Zod của `TShuttlecock`.
- Bổ sung `ShuttlecockApi.setDefault(id)` sử dụng Firestore `writeBatch` để đảm bảo tính nguyên tử (chỉ 1 loại cầu là `isDefault = true`).
- Cập nhật UI hàng loại cầu ở `/settings/shuttlecocks` với nút ngôi sao (Star) & Badge `Mặc định`.
- Cập nhật `useCalculator` tự động khởi tạo loại cầu mặc định khi mở màn hình tính tiền và thêm nhãn `(Mặc định)` trong dropdown của `SessionCostForm`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Firebase Firestore, Zod, Lucide Icons, Tailwind CSS.

---

### Task 1: Update Data Model & Firestore Schema for TShuttlecock

**Files:**

- Modify: `src/types/shuttlecock.types.ts`
- Modify: `src/libs/firebase/schema/shuttlecock.schema.ts`
- Modify: `src/libs/firebase/api/shuttlecock.api.ts`

- [x] Thêm `isDefault?: boolean` vào interface `TShuttlecock` trong `src/types/shuttlecock.types.ts`.
- [x] Cập nhật `shuttlecockSchema` trong `src/libs/firebase/schema/shuttlecock.schema.ts` thêm `isDefault: z.boolean().default(false)`.
- [x] Thêm method `setDefault(id: string): Promise<void>` vào class `ShuttlecockApi` trong `src/libs/firebase/api/shuttlecock.api.ts` dùng `writeBatch` để gán `isDefault: true` cho `id` và `isDefault: false` cho các bản ghi còn lại.

---

### Task 2: Implement UI for Default TShuttlecock in Settings Page

**Files:**

- Modify: `src/app/settings/shuttlecocks/page.tsx`

- [x] Hiển thị badge `Mặc định` kèm icon `Star` màu vàng bên cạnh tên loại cầu nếu `shuttlecock.isDefault === true`.
- [x] Thêm nút bấm ngôi sao / "Đặt làm mặc định" trên mỗi dòng loại cầu chưa phải mặc định.
- [x] Xử lý hàm `handleSetDefault(shuttlecock: TShuttlecock)`: gọi `ShuttlecockApi.setDefault(shuttlecock.id)`, cập nhật state `setShuttlecocks` ngay lập tức, hiển thị `toast.success`.

---

### Task 3: Auto-select Default TShuttlecock in Calculator & Update Dropdown Label

**Files:**

- Modify: `src/hooks/useCalculator.ts`
- Modify: `src/components/features/calculator/SessionCostForm.tsx`

- [x] Trong `useCalculator.ts`: khi `shuttlecocks` có dữ liệu và `input.shuttlecockId` chưa được chọn, tự động tìm loại cầu mặc định (`shuttlecocks.find(s => s.isDefault) ?? shuttlecocks[0]`) và khởi tạo `shuttlecockId`, `shuttleBrand`, `tubePrice`.
- [x] Trong `SessionCostForm.tsx`: hiển thị nhãn `{s.name}{s.isDefault ? ' (Mặc định)' : ''}` trong danh sách lựa chọn dropdown.

---

### Task 4: Verification & Quality Assurance

- [x] Chạy `npx next typegen` và `npx tsc --noEmit -p .` đảm bảo 0 lỗi kiểu.
- [x] Chạy `npx oxlint src` đảm bảo 0 warning, 0 error.
- [x] Chạy `npx oxfmt` kiểm tra format code.
- [x] Chạy `pnpm build` đảm bảo build production thành công.
