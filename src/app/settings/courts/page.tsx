'use client';

import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TCourt } from '@/types/court.type';
import type { TGroup } from '@/types/group.type';
import { EyeOff, MapPin, Pencil } from 'lucide-react';
import Link from 'next/link';
import { SettingsCourtAddForm, SettingsCourtEditForm } from './components/SettingsCourtForm';
import { useCourtsPage } from './hooks/useCourtsPage';

export default function CourtsManager() {
  const {
    courts,
    cloudIsOnline,
    disabled,
    loading,
    loadErrorMessage,
    editingId,
    setEditingId,
    groupsUsing,
    handleAdd,
    handleSaveEdit,
    handleHide,
  } = useCourtsPage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sân cầu lông</CardTitle>
        <CardDescription>Danh sách sân dùng chung cho mọi nhóm. Khi tính tiền, mỗi buổi chơi phải chọn 1 sân.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <SettingsCourtAddForm disabled={disabled} onSubmit={handleAdd} />

        {!cloudIsOnline && <p className="text-xs text-destructive">Chưa kết nối Cloud nên không thể chỉnh sửa.</p>}
        {loadErrorMessage && <p className="text-xs text-destructive">{loadErrorMessage}</p>}

        {loading ? (
          <LoadingState />
        ) : courts.length === 0 ? (
          <p className="text-muted-foreground">Chưa có sân nào. Thêm sân đầu tiên ở ô phía trên.</p>
        ) : (
          <ul className="divide-y">
            {courts.map((court: TCourt) => {
              const using: TGroup[] = groupsUsing(court.id);

              return (
                <li key={court.id} className="flex flex-wrap items-center gap-2 py-2 sm:flex-nowrap">
                  {editingId === court.id ? (
                    <SettingsCourtEditForm
                      initial={{ name: court.name, address: court.address }}
                      disabled={disabled}
                      onSubmit={(draft) => handleSaveEdit(court, draft)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{court.name}</p>
                        {court.address && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{court.address}</span>
                          </p>
                        )}
                        {using.length > 0 && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
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
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sửa sân"
                        title="Sửa sân"
                        onClick={() => setEditingId(court.id)}
                        disabled={disabled}
                        className="text-muted-foreground"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ẩn sân"
                        title="Ẩn sân"
                        onClick={() => handleHide(court)}
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
