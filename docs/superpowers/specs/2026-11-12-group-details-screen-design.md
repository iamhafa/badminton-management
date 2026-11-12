# Design Document: Group Details Screen (`/settings/groups/[id]`)

**Date:** 2026-11-12  
**Status:** Draft for Review

---

## 1. Intent & The Why

Trong màn hình **Tính tiền** (`/calculator`), người dùng thường tính tiền cho một nhóm cụ thể (`selectedGroup`). Khi cần chỉnh sửa mức trần ưu tiên nữ ("_Đổi trong Cài đặt_") hoặc quản lý thành viên ("_Quản lý thành viên_"), các liên kết hiện tại điều hướng cứng về danh sách chung `/settings/groups`.

Khi có nhiều nhóm (10–20 nhóm), trang `/settings/groups` trở nên rất dài, người dùng phải tự cuộn, tìm kiếm và bấm nút mở rộng nhóm của mình để chỉnh sửa. Điều này gây mất thời gian và dễ nhầm lẫn giữa các nhóm.

Mục tiêu là xây dựng màn hình **Chi tiết nhóm** (`/settings/groups/[id]`) để người dùng có thể nhảy thẳng vào chỉnh sửa thông tin (tên, mức trần nữ, sân mặc định) và danh sách thành viên của đúng nhóm đó.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals

- Chuyển trang danh sách `/settings/groups` thành màn hình **chỉ xem** (read-only overview):
  - Hiển thị danh sách các nhóm với thông tin tóm tắt: Tên nhóm, số lượng thành viên (nam/nữ), mức trần nữ, sân hay chơi, số buổi đã chơi.
  - **Bỏ hoàn toàn** form sửa nhóm inline và component quản lý thành viên inline trên trang này (không còn accordion kéo dài).
  - Mỗi thẻ nhóm có nút bấm/liên kết rõ ràng hoặc click vào nhóm để mở màn hình Chi tiết `/settings/groups/[id]`.
- Tạo trang dynamic route `/settings/groups/[id]/page.tsx` là nơi **duy nhất** thực hiện:
  - Xem và chỉnh sửa thông tin nhóm (Tên nhóm, mức trần ưu tiên nữ, sân hay chơi).
  - Xem danh sách đầy đủ thành viên và quản lý thành viên (`RosterManager` cho phép thêm, sửa, xóa thành viên).
  - Nút quay lại `← Danh sách nhóm`.
- Cập nhật các liên kết tại `/calculator`:
  - Liên kết _"Đổi trong Cài đặt"_ (trong `SessionCostForm.tsx`): trỏ tới `/settings/groups/${selectedGroup.id}`.
  - Nút _"Quản lý thành viên"_ (trong `ParticipantSelector.tsx`): trỏ tới `/settings/groups/${selectedGroup.id}`.

### Non-Goals

- Không thay đổi schema cơ sở dữ liệu Firestore hay Firebase API (`useGroups`, `useMutateSaveGroup`).
- Không làm thay đổi logic tính tiền (`useCalculator`) hay cấu trúc form thành viên (`RosterManager`).

### Anti-Goals

- Không phá vỡ luồng hiện tại của `/settings/groups` (vẫn giữ khả năng Tạo nhóm, Ẩn nhóm, Khôi phục nhóm).
- Không làm mất khả năng hoạt động offline (vẫn kế thừa trạng thái `cloudOnline` disable thao tác khi offline).

---

## 3. Approaches Considered

1. **Phương án 1 (Được chọn): Route chi tiết `/settings/groups/[id]`**
   - _Ưu điểm:_ Giao diện chuyên biệt, sạch sẽ, không bị phân tâm bởi các nhóm khác; người dùng thao tác trực diện; tương lai có thể bổ sung lịch sử các buổi chơi của riêng nhóm.
   - _Nhược điểm:_ Thêm 1 route mới trong `app/settings/groups/`.
   - _Lý do chọn:_ Đáp ứng chính xác mong muốn của người dùng, kiến trúc chuẩn RESTful trong Next.js App Router.

2. **Phương án 2: Query param trên danh sách `/settings/groups?id=...`**
   - _Ưu điểm:_ Không cần tạo route mới.
   - _Nhược điểm:_ Toàn bộ danh sách 10–20 nhóm vẫn render, người dùng vẫn bị rối mắt, dễ scroll nhầm sang nhóm khác.

3. **Phương án 3: Dialog / Drawer ngay tại Calculator**
   - _Ưu điểm:_ Không rời trang tính tiền.
   - _Nhược điểm:_ Chật chội trên mobile khi danh sách thành viên dài, không cung cấp URL riêng để chia sẻ hay bookmark.

---

## 4. Detailed Design & Architecture

### 4.1 Route `/settings/groups/[id]/page.tsx`

- **Path:** `src/app/settings/groups/[id]/page.tsx`
- **Layout:** Kế thừa từ `src/app/settings/layout.tsx` (có sẵn `SettingsNav`).
- **Header & Điều hướng:**
  - Nút `← Quay lại danh sách nhóm` (Link về `/settings/groups` hoặc `router.back()`).
  - Tiêu đề nhóm, số lượng thành viên, số buổi chơi đã tham gia.
- **Nội dung chính:**
  1. **Card 1: Thiết lập nhóm (Thông tin chung)**:
     - Tích hợp `GroupForm` (hoặc card tóm tắt kèm nút/form sửa inline) cho phép cập nhật: Tên nhóm, Mức trần nữ (`femaleCap`), Sân mặc định (`defaultCourtId`).
     - Validate trùng tên với các nhóm active khác.
  2. **Card 2: Danh sách thành viên**:
     - Nhúng trực tiếp `RosterManager` cho nhóm hiện tại.
     - Cho phép thêm, sửa, xóa thành viên, thay đổi vai trò (Trưởng nhóm / Thành viên), giới tính.
- **Trạng thái đặc biệt:**
  - Nếu `groupId` không tìm thấy trong danh sách `activeGroups`: Hiển thị thông báo "Không tìm thấy nhóm này hoặc nhóm đã bị ẩn" kèm nút quay về danh sách.

### 4.2 Cập nhật Navigation tại `/calculator`

- **`SessionCostForm.tsx`**:
  - Nhận prop `selectedGroupId?: string`.
  - Link _"Đổi trong Cài đặt"_:
    ```tsx
    <Link
      href={selectedGroupId ? `/settings/groups/${selectedGroupId}` : '/settings/groups'}
      className="font-semibold text-[#059669] underline not-italic"
    >
      Đổi trong Cài đặt
    </Link>
    ```
- **`ParticipantSelector.tsx` & `page.tsx`**:
  - `onNavigateRoster` trong `CalculatorPage`:
    ```tsx
    onNavigateRoster={() => {
      if (selectedGroup?.id) {
        router.push(`/settings/groups/${selectedGroup.id}`);
      } else {
        router.push('/settings/groups');
      }
    }}
    ```

### 4.3 Cập nhật trang danh sách `/settings/groups/page.tsx`

- Bổ sung nút liên kết `"Chi tiết"` hoặc bấm vào tiêu đề thẻ nhóm để mở `/settings/groups/${group.id}`.

---

## 5. Verification Plan

- Chạy `npx tsc --noEmit -p .` kiểm tra type an toàn.
- Chạy `npx oxlint src` kiểm tra linting.
- Chạy `npx oxfmt "src/**/*.{ts,tsx,json}" "*.json" ".*.json"` đảm bảo code style.
- Kiểm tra luồng UI:
  1. Tại Calculator, chọn nhóm A -> bấm "Đổi trong Cài đặt" -> đến thẳng `/settings/groups/[id-A]`.
  2. Tại Calculator, bấm "Quản lý thành viên" -> đến thẳng `/settings/groups/[id-A]`.
  3. Chỉnh sửa tên, trần nữ, thành viên -> lưu thành công và quay lại Calculator thấy dữ liệu được cập nhật.
