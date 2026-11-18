'use client';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TShuttlecock } from '@/types/shuttlecock.type';
import { formatVND, SHUTTLES_PER_TUBE } from '@/utils/format';
import { Feather, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import SettingsShuttlecockForm from './components/SettingsShuttlecockForm';
import { useShuttlecocksPage } from './hooks/useShuttlecocksPage';
import type { ShuttlecockDraft } from './schemas/shuttlecock.schema';
const NEW_SHUTTLECOCK_DRAFT: ShuttlecockDraft = { name: '', tube_price: 0 };
export default function ShuttlecocksManager() {
  const {
    shuttlecocks,
    cloudOnline,
    disabled,
    loading,
    loadErrorMessage,
    creating,
    editingId,
    openCreating,
    openEditing,
    closeForm,
    handleAdd,
    handleSaveEdit,
    handleDelete,
    handleSetDefault,
  } = useShuttlecocksPage();
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Loại cầu lông</CardTitle>
          <CardDescription className="flex flex-col gap-0.5">
            <span>Mỗi ống 12 quả. Giá ống ở đây là giá đề xuất, khi tính tiền vẫn có thể chỉnh sửa lại.</span>
            <span className="text-xs text-amber-800">
              ⭐ Loại cầu được đánh dấu mặc định sẽ luôn được tự động chọn sẵn khi vào màn hình tính tiền.
            </span>
          </CardDescription>
          {!creating && (
            <CardAction>
              <Button size="sm" onClick={openCreating} disabled={disabled}>
                <Plus /> Thêm loại cầu
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3 empty:hidden">
          {!cloudOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
          {loadErrorMessage && <p className="text-xs text-destructive">{loadErrorMessage}</p>}
          {creating && (
            <SettingsShuttlecockForm
              initial={NEW_SHUTTLECOCK_DRAFT}
              submitLabel="Thêm loại cầu"
              disabled={disabled}
              onSubmit={handleAdd}
              onCancel={closeForm}
            />
          )}
          {loading ? (
            <LoadingState />
          ) : shuttlecocks.length === 0 && !creating ? (
            <p className="text-muted-foreground">Chưa có loại cầu nào. Bấm "Thêm loại cầu" để bắt đầu.</p>
          ) : null}
        </CardContent>
      </Card>
      {/* Danh sách loại cầu: gom trong 1 card, các loại ngăn bằng đường kẻ */}
      {shuttlecocks.length > 0 && (
        <Card size="sm">
          <CardContent>
            <ul className="divide-y">
              {shuttlecocks.map((shuttlecock: TShuttlecock) => {
                const perShuttle: number = Math.round(shuttlecock.tube_price / SHUTTLES_PER_TUBE);
                if (editingId === shuttlecock.id) {
                  return (
                    <li key={shuttlecock.id} className="py-3 first:pt-0 last:pb-0">
                      <SettingsShuttlecockForm
                        initial={{ name: shuttlecock.name, tube_price: shuttlecock.tube_price }}
                        submitLabel="Lưu"
                        disabled={disabled}
                        onSubmit={(draft) => handleSaveEdit(shuttlecock, draft)}
                        onCancel={closeForm}
                      />
                    </li>
                  );
                }
                return (
                  <li key={shuttlecock.id} className="py-3 first:pt-0 last:pb-0">
                    <CardHeader className="px-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="truncate">{shuttlecock.name}</span>
                        {shuttlecock.is_default && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            <Star className="size-3 fill-amber-500 text-amber-500" /> Mặc định
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="inline-flex items-center gap-1 text-xs text-gray-700">
                        <Feather className="size-3.5 shrink-0 text-emerald-600" />
                        {formatVND(shuttlecock.tube_price)}/ống ({formatVND(perShuttle)}/quả)
                      </CardDescription>
                      <CardAction className="flex items-center gap-1">
                        {/* Luôn giữ chỗ cho nút sao để các nút sửa/xóa thẳng cột giữa các card */}
                        {shuttlecock.is_default ? (
                          <span
                            role="img"
                            aria-label="Đang là loại cầu mặc định"
                            title="Đang là loại cầu mặc định"
                            className="inline-flex size-7 items-center justify-center"
                          >
                            <Star className="size-3.5 fill-amber-500 text-amber-500" />
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Đặt làm mặc định"
                            title="Đặt làm loại cầu mặc định khi tính tiền"
                            onClick={() => handleSetDefault(shuttlecock)}
                            disabled={disabled}
                            className="size-7 text-muted-foreground hover:text-amber-600"
                          >
                            <Star className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Sửa loại cầu"
                          title="Sửa loại cầu"
                          onClick={() => openEditing(shuttlecock.id)}
                          disabled={disabled}
                          className="size-7 text-muted-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Xóa loại cầu"
                          title="Xóa loại cầu"
                          onClick={() => handleDelete(shuttlecock)}
                          disabled={disabled}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </CardAction>
                    </CardHeader>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
