'use client';

import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TShuttlecock } from '@/types/shuttlecock.types';
import { formatVND, SHUTTLES_PER_TUBE } from '@/utils/format';
import { EyeOff, Feather, Pencil, Star } from 'lucide-react';
import { SettingsShuttlecockAddForm, SettingsShuttlecockEditForm } from './components/SettingsShuttlecockForm';
import { useShuttlecocksPage } from './hooks/useShuttlecocksPage';

export default function ShuttlecocksManager() {
  const {
    shuttlecocks,
    cloudOnline,
    disabled,
    loading,
    loadErrorMessage,
    editingId,
    setEditingId,
    handleAdd,
    handleSaveEdit,
    handleHide,
    handleSetDefault,
  } = useShuttlecocksPage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loại cầu lông</CardTitle>
        <CardDescription className="flex flex-col gap-0.5">
          <span>Mỗi ống 12 quả. Giá ống ở đây là giá đề xuất, khi tính tiền vẫn có thể chỉnh sửa lại.</span>
          <span className="text-xs text-amber-800">
            ⭐ Loại cầu được đánh dấu mặc định sẽ luôn được tự động chọn sẵn khi vào màn hình tính tiền.
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <SettingsShuttlecockAddForm disabled={disabled} onSubmit={handleAdd} />

        {!cloudOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
        {loadErrorMessage && <p className="text-xs text-destructive">{loadErrorMessage}</p>}

        {loading ? (
          <LoadingState />
        ) : shuttlecocks.length === 0 ? (
          <p className="text-muted-foreground">Chưa có loại cầu nào. Thêm loại cầu đầu tiên ở ô phía trên.</p>
        ) : (
          <ul className="divide-y">
            {shuttlecocks.map((shuttlecock: TShuttlecock) => {
              const perShuttle: number = Math.round(shuttlecock.tubePrice / SHUTTLES_PER_TUBE);

              return (
                <li key={shuttlecock.id} className="flex flex-wrap items-center gap-2 py-2 sm:flex-nowrap">
                  {editingId === shuttlecock.id ? (
                    <SettingsShuttlecockEditForm
                      initial={{ name: shuttlecock.name, tubePrice: shuttlecock.tubePrice }}
                      disabled={disabled}
                      onSubmit={(draft) => handleSaveEdit(shuttlecock, draft)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{shuttlecock.name}</p>
                          {shuttlecock.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-300">
                              <Star className="size-3 fill-amber-500 text-amber-500" /> Mặc định
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Feather className="size-3 shrink-0" />
                          <span>
                            {formatVND(shuttlecock.tubePrice)}/ống ({formatVND(perShuttle)}/quả)
                          </span>
                        </p>
                      </div>
                      {!shuttlecock.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Đặt làm mặc định"
                          title="Đặt làm loại cầu mặc định khi tính tiền"
                          onClick={() => handleSetDefault(shuttlecock)}
                          disabled={disabled}
                          className="text-muted-foreground hover:text-amber-600"
                        >
                          <Star className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sửa loại cầu"
                        title="Sửa loại cầu"
                        onClick={() => setEditingId(shuttlecock.id)}
                        disabled={disabled}
                        className="text-muted-foreground"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ẩn loại cầu"
                        title="Ẩn loại cầu"
                        onClick={() => handleHide(shuttlecock)}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <EyeOff />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
