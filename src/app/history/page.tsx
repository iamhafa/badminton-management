'use client';

import { Button } from '@/components/ui/button';
import { cn } from 'cn';
import { RotateCcw } from 'lucide-react';
import { HistoryAllSettled, HistoryEmpty, HistorySkeleton } from './components/HistoryEmptyStates';
import HistoryMonthHeader from './components/HistoryMonthHeader';
import HistorySessionCard from './components/HistorySessionCard';
import { useHistoryPage } from './hooks/useHistoryPage';
import { ALL_GROUPS } from './utils/filter';

export default function HistoryPage() {
  const {
    cloudOnline,
    loading,
    error,
    totalCount,
    visibleCount,
    unsettledCount,
    months,
    filterOptions,
    groupFilter,
    setGroupFilter,
    unsettledOnly,
    toggleUnsettledOnly,
    expandedId,
    setExpandedId,
    deletingId,
    groupNameOf,
    refresh,
    setPayment,
    markAllPaid,
    removeSession,
  } = useHistoryPage();

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Lịch sử buổi chơi ({visibleCount})</h2>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading || !cloudOnline}>
          <RotateCcw className={cn(loading && 'animate-spin')} /> Tải lại
        </Button>
      </div>

      {totalCount > 0 && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {filterOptions.length > 1 && (
            <fieldset className="flex min-w-0 flex-wrap gap-1.5">
              <legend className="sr-only">Lọc theo nhóm</legend>
              {[{ id: ALL_GROUPS, name: 'Tất cả', count: totalCount }, ...filterOptions].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGroupFilter(opt.id)}
                  aria-pressed={groupFilter === opt.id}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    groupFilter === opt.id
                      ? 'border-[#0a6c44] bg-[#0a6c44] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {opt.name} ({opt.count})
                </button>
              ))}
            </fieldset>
          )}
          <button
            type="button"
            onClick={toggleUnsettledOnly}
            aria-pressed={unsettledOnly}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              unsettledOnly
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
            )}
          >
            Chưa thu đủ ({unsettledCount})
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && totalCount === 0 ? (
        <HistorySkeleton />
      ) : totalCount === 0 ? (
        <HistoryEmpty />
      ) : visibleCount === 0 ? (
        <HistoryAllSettled />
      ) : (
        <div className="flex flex-col gap-3">
          {months.map((month) => (
            <section key={month.key} className="flex flex-col gap-2" aria-label={month.label}>
              <HistoryMonthHeader
                label={month.label}
                count={month.sessions.length}
                total={month.total}
                outstanding={month.outstanding}
              />
              <ul className="flex flex-col gap-2.5">
                {month.sessions.map((bill) => (
                  <li key={bill.id}>
                    <HistorySessionCard
                      bill={bill}
                      groupName={groupNameOf(bill)}
                      expanded={expandedId === bill.id}
                      onExpandedChange={(open) => setExpandedId(open ? (bill.id ?? null) : null)}
                      deleting={deletingId === bill.id}
                      cloudOnline={cloudOnline}
                      onDelete={() => void removeSession(bill)}
                      onSetPayment={(playerId, paid) => void setPayment(bill, playerId, paid)}
                      onMarkAllPaid={() => void markAllPaid(bill)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
