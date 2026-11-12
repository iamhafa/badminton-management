# Group Details Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng màn hình chi tiết nhóm `/settings/groups/[id]` và liên kết trực tiếp từ màn hình Tính tiền (`/calculator`) và Danh sách nhóm (`/settings/groups`).

**Architecture:** Sử dụng dynamic route `src/app/settings/groups/[id]/page.tsx` trong Next.js App Router kết hợp các hook `useGroups`, `useCourts`, `useSessions`, `useMutateSaveGroup` hiện có. Tái sử dụng `GroupForm` và `RosterManager` để chỉnh sửa thông tin nhóm và quản lý danh sách thành viên.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TanStack React Query, Tailwind CSS v4, Lucide React, Sonner.

**Spec:** [docs/superpowers/specs/2026-11-12-group-details-screen-design.md](file:///Users/iamhafa/Workspace/NEXT/badminton-management/docs/superpowers/specs/2026-11-12-group-details-screen-design.md)

## Global Constraints

- Tuân thủ quy tắc kiến trúc trong `AGENTS.md`: không sửa trực tiếp file trong `src/components/ui/`.
- Kiểm tra toàn bộ mã nguồn trước khi hoàn thành: `npx tsc --noEmit -p .`, `npx oxlint src`, `npx oxfmt "src/**/*.{ts,tsx,json}" "*.json" ".*.json"`.
- Trạng thái offline (`!cloudOnline`) phải disable các hành động lưu/sửa tương tự các màn hình khác trong Settings.

## Review Focus

- Trường hợp `groupId` không tồn tại hoặc đã bị ẩn (`deletedAt != null`): hiển thị giao diện báo lỗi rõ ràng kèm nút quay lại `/settings/groups`.
- Kiểm tra validate trùng tên khi đổi tên nhóm trên trang chi tiết (không tính chính nhóm đang sửa).
- Đảm bảo các thay đổi tên, trần nữ, sân mặc định, danh sách thành viên cập nhật tức thời và đồng bộ với TanStack Query cache.
- Đảm bảo nút quay lại hoạt động mượt mà, hỗ trợ quay lại danh sách nhóm hoặc màn hình trước đó.

---

### Task 1: Tạo màn hình chi tiết nhóm `src/app/settings/groups/[id]/page.tsx`

**Files:**

- Create: `src/app/settings/groups/[id]/page.tsx`

**Steps:**

- [ ] 1. Tạo component `'use client'` `GroupDetailPage` lấy `id` qua `useParams()` từ `next/navigation`.
- [ ] 2. Tải dữ liệu bằng `useGroups()`, `useCourts()`, `useSessions()`, lấy trạng thái `cloudOnline` từ `useConnectionStore`.
- [ ] 3. Xử lý trạng thái Loading (dùng `<LoadingState />`) và Not Found (khi không tìm thấy nhóm hoặc nhóm đã bị ẩn) kèm nút quay về `/settings/groups`.
- [ ] 4. Tạo Header cho trang chi tiết:
  - Nút `← Danh sách nhóm` (Link về `/settings/groups`).
  - Tiêu đề nhóm, tóm tắt thông tin: số thành viên (nam/nữ), mức trần nữ, sân hay chơi, số buổi đã tham gia.
- [ ] 5. Tạo Card Thông tin nhóm:
  - Hiển thị thông tin hiện tại kèm nút Sửa (toggle mở `GroupForm`).
  - Khi submit `GroupForm`, gọi `saveGroup.mutateAsync` cập nhật nhóm, validate trùng tên với các nhóm active khác.
- [ ] 6. Tạo Card Danh sách thành viên:
  - Nhúng trực tiếp `<RosterManager />` với `roster={group.members}`.
  - Khi lưu danh sách thành viên, cập nhật nhóm qua `saveGroup.mutateAsync`.
- [ ] 7. Chạy type check `npx tsc --noEmit -p .` để đảm bảo không lỗi kiểu dữ liệu.

---

### Task 2: Cập nhật điều hướng từ `/calculator` tới trang chi tiết nhóm

**Files:**

- Modify: `src/components/features/calculator/SessionCostForm.tsx`
- Modify: `src/app/calculator/page.tsx`

**Steps:**

- [ ] 1. Trong `SessionCostForm.tsx`:
  - Cập nhật liên kết _"Đổi trong Cài đặt"_ ở mục Mức trần ưu tiên nữ để trỏ tới `/settings/groups/${input.groupId}` (nếu có `input.groupId`) hoặc fallback về `/settings/groups`.
- [ ] 2. Trong `src/app/calculator/page.tsx`:
  - Cập nhật hàm `onNavigateRoster` truyền vào `ParticipantSelector`:
    ```tsx
    onNavigateRoster={() => {
      if (selectedGroup?.id) {
        router.push(`/settings/groups/${selectedGroup.id}`);
      } else {
        router.push('/settings/groups');
      }
    }}
    ```
- [ ] 3. Chạy type check `npx tsc --noEmit -p .` để kiểm tra.

---

### Task 3: Cập nhật trang danh sách nhóm `src/app/settings/groups/page.tsx`

**Files:**

- Modify: `src/app/settings/groups/page.tsx`

**Steps:**

- [ ] 1. Bổ sung nút liên kết `"Chi tiết"` hoặc cho phép bấm vào tiêu đề/thẻ nhóm để chuyển sang `/settings/groups/${group.id}`.
- [ ] 2. Giữ nguyên các chức năng inline hiện tại (Sửa nhanh, Ẩn nhóm, Khôi phục nhóm) để người dùng có đầy đủ lựa chọn.
- [ ] 3. Chạy type check `npx tsc --noEmit -p .`.

---

### Task 4: Kiểm thử, xác minh và định dạng mã nguồn

**Files:**

- Tất cả các file đã sửa và tạo mới

**Steps:**

- [ ] 1. Chạy `npx tsc --noEmit -p .` và xác nhận không có lỗi TypeScript.
- [ ] 2. Chạy `npx oxlint src` và xác nhận không có lỗi linting.
- [ ] 3. Chạy `npx oxfmt "src/**/*.{ts,tsx,json}" "*.json" ".*.json"` để định dạng code theo chuẩn dự án.
- [ ] 4. Xác nhận luồng nghiệp vụ:
  - Từ `/calculator`, chọn nhóm bất kỳ -> bấm "Đổi trong Cài đặt" -> mở đúng nhóm tại `/settings/groups/[id]`.
  - Từ `/calculator`, bấm "Quản lý thành viên" -> mở đúng nhóm tại `/settings/groups/[id]`.
  - Từ `/settings/groups`, bấm vào nhóm -> mở đúng nhóm tại `/settings/groups/[id]`.
  - Thử sửa thông tin và thành viên trên trang chi tiết -> lưu thành công.
