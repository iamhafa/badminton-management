'use client';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TCourt } from '@/types/court.type';
import type { TGroup } from '@/types/group.type';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import SettingsCourtForm from './components/SettingsCourtForm';
import { useCourtsPage } from './hooks/useCourtsPage';
import type { CourtDraft } from './schemas/court.schema';
const NEW_COURT_DRAFT: CourtDraft = { name: '', address: '' };
export default function CourtsManager() {
  const {
    courts,
    cloudIsOnline,
    disabled,
    loading,
    loadErrorMessage,
    creating,
    editingId,
    openCreating,
    openEditing,
    closeForm,
    groupsUsing,
    handleAdd,
    handleSaveEdit,
    handleDelete,
  } = useCourtsPage();
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Sân cầu lông</CardTitle>
          <CardDescription>Danh sách sân dùng chung cho mọi nhóm. Khi tính tiền, mỗi buổi chơi phải chọn 1 sân.</CardDescription>
          {!creating && (
            <CardAction>
              <Button size="sm" onClick={openCreating} disabled={disabled}>
                <Plus /> Thêm sân
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3 empty:hidden">
          {!cloudIsOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
          {loadErrorMessage && <p className="text-xs text-destructive">{loadErrorMessage}</p>}
          {creating && (
            <SettingsCourtForm
              initial={NEW_COURT_DRAFT}
              submitLabel="Thêm sân"
              disabled={disabled}
              onSubmit={handleAdd}
              onCancel={closeForm}
            />
          )}
          {loading ? (
            <LoadingState />
          ) : courts.length === 0 && !creating ? (
            <p className="text-muted-foreground">Chưa có sân nào. Bấm "Thêm sân" để bắt đầu.</p>
          ) : null}
        </CardContent>
      </Card>
      {/* Danh sách sân: gom trong 1 card, các sân ngăn bằng đường kẻ */}
      {courts.length > 0 && (
        <Card size="sm">
          <CardContent>
            <ul className="divide-y">
              {courts.map((court: TCourt) => {
                const using: TGroup[] = groupsUsing(court.id);
                if (editingId === court.id) {
                  return (
                    <li key={court.id} className="py-3 first:pt-0 last:pb-0">
                      <SettingsCourtForm
                        initial={{ name: court.name, address: court.address }}
                        submitLabel="Lưu"
                        disabled={disabled}
                        onSubmit={(draft) => handleSaveEdit(court, draft)}
                        onCancel={closeForm}
                      />
                    </li>
                  );
                }
                return (
                  <li key={court.id} className="py-3 first:pt-0 last:pb-0">
                    <CardHeader className="px-0">
                      <CardTitle className="text-base">{court.name}</CardTitle>
                      <CardDescription className="flex flex-col gap-1 text-xs">
                        {court.address && (
                          <span className="inline-flex items-start gap-1 text-gray-700">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-gray-500" />
                            <span className="wrap-break-word">{court.address}</span>
                          </span>
                        )}
                        {using.length > 0 && (
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>Sân mặc định của</span>
                            {using.map((group: TGroup) => (
                              <Link
                                key={group.id}
                                href={`/settings/groups/${group.id}`}
                                className="font-semibold text-[#059669] underline hover:text-emerald-800"
                              >
                                {group.name}
                              </Link>
                            ))}
                          </span>
                        )}
                      </CardDescription>
                      <CardAction className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Sửa sân"
                          title="Sửa sân"
                          onClick={() => openEditing(court.id)}
                          disabled={disabled}
                          className="size-7 text-muted-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Xóa sân"
                          title="Xóa sân"
                          onClick={() => handleDelete(court)}
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
