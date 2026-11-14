import {
  Activity,
  AlertCircle,
  Banknote,
  ChefHat,
  Clock,
  Filter,
  Radio,
  Receipt,
  Search,
  UserCheck,
  Users,
  Utensils,
} from 'lucide-react';
import { useState } from 'react';
import type { ActivityEntry, StaffRole } from '../types/restaurant';

interface StaffActivityReportPanelProps {
  activityLog: ActivityEntry[];
}

export function StaffActivityReportPanel({ activityLog }: StaffActivityReportPanelProps) {
  const [roleFilter, setRoleFilter] = useState<'all' | 'waiter' | 'kitchen' | 'cashier' | 'guest'>(
    'all',
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLog = activityLog.filter((entry) => {
    if (roleFilter !== 'all') {
      if (entry.actorRole !== roleFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = entry.action.toLowerCase().includes(q);
      const matchDetail = entry.detail.toLowerCase().includes(q);
      const matchActor = entry.actorName ? entry.actorName.toLowerCase().includes(q) : false;
      return matchAction || matchDetail || matchActor;
    }
    return true;
  });

  const waiterCount = activityLog.filter((e) => e.actorRole === 'waiter').length;
  const kitchenCount = activityLog.filter((e) => e.actorRole === 'kitchen').length;
  const cashierCount = activityLog.filter((e) => e.actorRole === 'cashier').length;
  const guestCount = activityLog.filter((e) => e.actorRole === 'guest').length;

  const getRoleBadge = (role?: StaffRole | 'guest', actorName?: string) => {
    switch (role) {
      case 'waiter':
        return {
          icon: UserCheck,
          label: actorName || 'Ofitsiant',
          className: 'border-[#C9A84C]/40 bg-[#C9A84C]/15 text-[#E6CB7D]',
        };
      case 'kitchen':
        return {
          icon: ChefHat,
          label: actorName || 'Oshpaz (0500)',
          className: 'border-[#8B3A2A]/50 bg-[#8B3A2A]/20 text-[#F0A495]',
        };
      case 'cashier':
        return {
          icon: Receipt,
          label: actorName || 'Kassir (0900)',
          className: 'border-[#2D4A3E] bg-[#2D4A3E]/30 text-[#A9CEBE]',
        };
      case 'guest':
        return {
          icon: Utensils,
          label: actorName || 'Mijoz (QR / NFC)',
          className: 'border-[#C9A84C]/25 bg-[#14100C] text-[#B8AE98]',
        };
      default:
        return {
          icon: Activity,
          label: actorName || 'Tizim',
          className: 'border-[#C9A84C]/20 bg-[#0A0806] text-[#B8AE98]',
        };
    }
  };

  return (
    <div data-testid="staff-activity-report-panel" className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-[#C9A84C]/35 bg-[#14100C] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2D4A3E] bg-[#2D4A3E]/35 px-3 py-1 text-xs font-semibold text-[#A9CEBE]">
              <Radio className="h-3.5 w-3.5 animate-pulse text-[#A9CEBE]" />
              <span>JONLI ATCHOT · REAL VAQT REJIMI</span>
            </div>
            <h2 className="font-display mt-2 text-2xl sm:text-3xl font-bold text-[#F5EDD6]">
              Xodimlar Atchoti & Jonli Harakatlar Jurnali
            </h2>
            <p className="mt-1 text-xs text-[#B8AE98]">
              Har bir xodimning nima ish qilayotgani: qaysi ofitsiant buyurtma oldi, oshpazlar taom
              pishirdi, kassir cheklarni yopdi va xarajatlarni qayd etdi.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#E6CB7D] bg-[#0A0806] border border-[#C9A84C]/30 px-3.5 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Jami qaydlar: {activityLog.length} ta</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Role Counter Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setRoleFilter('waiter')}
          className={`rounded-xl border p-4 text-left transition-all ${
            roleFilter === 'waiter'
              ? 'border-[#E6CB7D] bg-[#1C160E] shadow-md'
              : 'border-[#C9A84C]/25 bg-[#14100C] hover:border-[#C9A84C]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#E6CB7D]">
            <span>Ofitsiantlar (2100, 0800)</span>
            <UserCheck className="h-4 w-4" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-[#F5EDD6]">
            {waiterCount} ta
          </p>
          <p className="mt-1 text-[11px] text-[#B8AE98]">Buyurtma olish & chek so‘rovlari</p>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter('kitchen')}
          className={`rounded-xl border p-4 text-left transition-all ${
            roleFilter === 'kitchen'
              ? 'border-[#F0A495] bg-[#1F120E] shadow-md'
              : 'border-[#8B3A2A]/40 bg-[#14100C] hover:border-[#8B3A2A]/70'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#F0A495]">
            <span>Oshpazlar KDS (0500)</span>
            <ChefHat className="h-4 w-4" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-[#F5EDD6]">
            {kitchenCount} ta
          </p>
          <p className="mt-1 text-[11px] text-[#B8AE98]">Pishirish & tayyorlash holatlari</p>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter('cashier')}
          className={`rounded-xl border p-4 text-left transition-all ${
            roleFilter === 'cashier'
              ? 'border-[#A9CEBE] bg-[#101915] shadow-md'
              : 'border-[#2D4A3E] bg-[#14100C] hover:border-[#3A6151]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#A9CEBE]">
            <span>Kassir Kassa (0900)</span>
            <Receipt className="h-4 w-4" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-[#F5EDD6]">
            {cashierCount} ta
          </p>
          <p className="mt-1 text-[11px] text-[#B8AE98]">To‘lovlar, Soliq QR, xomashyo chiqimlari</p>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter('guest')}
          className={`rounded-xl border p-4 text-left transition-all ${
            roleFilter === 'guest'
              ? 'border-[#E6CB7D] bg-[#1C160E] shadow-md'
              : 'border-[#C9A84C]/20 bg-[#14100C] hover:border-[#C9A84C]/45'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#E5DEC9]">
            <span>Mijozlar (QR / NFC)</span>
            <Utensils className="h-4 w-4" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums text-[#F5EDD6]">
            {guestCount} ta
          </p>
          <p className="mt-1 text-[11px] text-[#B8AE98]">Stoldan buyurtma & atmenlar</p>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#C9A84C]/25 bg-[#14100C] p-1 text-xs">
          {(
            [
              { id: 'all', label: `Barchasi (${activityLog.length})` },
              { id: 'waiter', label: `Ofitsiantlar (${waiterCount})` },
              { id: 'kitchen', label: `Oshpazlar (${kitchenCount})` },
              { id: 'cashier', label: `Kassa (${cashierCount})` },
              { id: 'guest', label: `Mehmonlar (${guestCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                roleFilter === tab.id
                  ? 'bg-[#C9A84C] text-[#0A0806]'
                  : 'text-[#B8AE98] hover:text-[#F5EDD6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#C9A84C]" />
          <input
            type="text"
            aria-label="Atchotdan qidirish"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Xodim ismi, stol # yoki amal..."
            className="w-full rounded-lg border border-[#C9A84C]/30 bg-[#0A0806] py-1.5 pl-9 pr-3 text-xs text-[#F5EDD6] placeholder-[#B8AE98]/60 focus:border-[#E6CB7D] focus:outline-none"
          />
        </div>
      </div>

      {/* Activity Log Feed */}
      <div className="rounded-xl border border-[#C9A84C]/30 bg-[#14100C] divide-y divide-[#C9A84C]/10 overflow-hidden">
        {filteredLog.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#B8AE98]">
            Tanlangan mezon bo‘yicha harakatlar topilmadi.
          </div>
        ) : (
          filteredLog.map((item) => {
            const roleInfo = getRoleBadge(item.actorRole, item.actorName);
            const RoleIcon = roleInfo.icon;
            return (
              <div
                key={item.id}
                data-testid={`activity-row-${item.id}`}
                className="flex items-start justify-between gap-4 p-4 hover:bg-[#1A140E] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg border p-2 shrink-0 ${roleInfo.className}`}>
                    <RoleIcon className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-[#F5EDD6]">{item.action}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleInfo.className}`}
                      >
                        {roleInfo.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#B8AE98] leading-relaxed">{item.detail}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#C9A84C]">
                    <Clock className="h-3 w-3" />
                    {item.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
