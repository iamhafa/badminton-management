import type { Gender } from '@/types/player.type';

/**
 * Đếm người chơi theo giới tính. Database không lưu sẵn các con số này (đếm được từ `session_players`),
 * nên màn hình tính tiền và lịch sử dùng chung hàm này.
 */
export function countPlayers(players: ReadonlyArray<{ gender: Gender }>): {
  totalCount: number;
  maleCount: number;
  femaleCount: number;
} {
  const femaleCount = players.filter((p) => p.gender === 'FEMALE').length;
  return { totalCount: players.length, maleCount: players.length - femaleCount, femaleCount };
}

/** Tổng tiền thực thu sau làm tròn (có thể lệch vài nghìn so với tổng chi phí). */
export function sumRoundedPayable(players: ReadonlyArray<{ rounded_payable: number }>): number {
  return players.reduce((sum, p) => sum + p.rounded_payable, 0);
}
