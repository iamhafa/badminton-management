import { Badge } from '@/components/ui/badge';
import { cn } from '@/libs/utils';
import type { Gender, MemberRole } from '@/types/badminton';
import { Crown, Shield } from 'lucide-react';

export const ROLE_LABELS: Record<MemberRole, string> = {
  LEADER: 'Trưởng nhóm',
  VICE_LEADER: 'Phó nhóm',
};

export default function RoleBadge({ role, className }: { role?: MemberRole; className?: string }) {
  if (!role) return null;
  const isLeader = role === 'LEADER';
  const Icon = isLeader ? Crown : Shield;
  return (
    <Badge
      title={ROLE_LABELS[role]}
      className={cn('border-transparent', isLeader ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-700', className)}
    >
      <Icon />
      {isLeader ? 'Trưởng' : 'Phó'}
    </Badge>
  );
}

export function GenderTag({ gender, className }: { gender: Gender; className?: string }) {
  return (
    <Badge
      className={cn(
        'shrink-0 border-transparent',
        gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700',
        className,
      )}
    >
      {gender === 'FEMALE' ? 'Nữ' : 'Nam'}
    </Badge>
  );
}
