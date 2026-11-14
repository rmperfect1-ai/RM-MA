import { KeyRound, Plus, Trash2, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import type { RestaurantSettings, WaiterProfile } from '../types/restaurant';

interface WaiterRosterManagerProps {
  waiters: WaiterProfile[];
  settings: RestaurantSettings;
  onAddWaiter: (input: {
    name: string;
    pinCode: string;
    commissionPercent?: number;
  }) => Promise<WaiterProfile>;
  onUpdateWaiter: (
    id: string,
    patch: Partial<Pick<WaiterProfile, 'name' | 'pinCode' | 'commissionPercent' | 'active'>>,
  ) => Promise<WaiterProfile>;
  onDeleteWaiter: (id: string) => Promise<void>;
  onUpdateSettings: (patch: Partial<RestaurantSettings>) => Promise<RestaurantSettings>;
  onImpersonateWaiter?: (waiter: WaiterProfile) => void;
}

export function WaiterRosterManager({
  waiters,
  settings,
  onAddWaiter,
  onUpdateWaiter,
  onDeleteWaiter,
  onUpdateSettings,
  onImpersonateWaiter,
}: WaiterRosterManagerProps) {
  const [name, setName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [customPercent, setCustomPercent] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [defaultWaiterPct, setDefaultWaiterPct] = useState(
    String(settings.defaultWaiterCommissionPercent),
  );
  const [servicePct, setServicePct] = useState(String(settings.serviceChargePercent));
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const pctNum = customPercent.trim() ? Number(customPercent) : undefined;
      await onAddWaiter({
        name,
        pinCode,
        commissionPercent: pctNum,
      });
      setName('');
      setPinCode('');
      setCustomPercent('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onUpdateSettings({
      defaultWaiterCommissionPercent: Number(defaultWaiterPct) || 0,
      serviceChargePercent: Number(servicePct) || 0,
    });
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Global Commission & Soliq.uz Fiscal Settings */}
      <form
        onSubmit={handleSaveGlobalSettings}
        className="rounded-xl border border-[#C9A84C]/30 bg-[#14100C] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C9A84C]/18 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
              Foiz Stavkasi & Soliq.uz Fiskal Sozlamalar
            </p>
            <h2 className="font-display mt-0.5 text-2xl font-semibold text-[#F5EDD6]">
              Ofitsiant Ulushi (%) va Xizmat Haqi
            </h2>
          </div>
          {settingsSaved && (
            <span className="rounded-md border border-[#2D4A3E] bg-[#121D18] px-3 py-1 text-xs font-medium text-[#A9CEBE]">
              Saqlandi!
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div>
            <label htmlFor="admin-waiter-pct" className="block text-xs font-medium text-[#E5DEC9]">
              Ofitsiantga beriladigan ulush (%)
            </label>
            <input
              id="admin-waiter-pct"
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={defaultWaiterPct}
              onChange={(e) => setDefaultWaiterPct(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm tabular-nums text-[#F5EDD6]"
            />
          </div>

          <div>
            <label htmlFor="admin-service-pct" className="block text-xs font-medium text-[#E5DEC9]">
              Chekdagi Xizmat haqi (%)
            </label>
            <input
              id="admin-service-pct"
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={servicePct}
              onChange={(e) => setServicePct(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm tabular-nums text-[#F5EDD6]"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-[#C9A84C] px-4 py-2.5 text-xs font-bold text-[#0A0806] hover:bg-[#E6CB7D]"
          >
            Foiz stavkalarini saqlash
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Add Waiter Form */}
        <form
          onSubmit={handleAdd}
          className="h-fit rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-5 sm:p-6 lg:col-span-4 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#C9A84C]" />
            <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
              Yangi Ofitsiant Qo‘shish
            </h3>
          </div>
          <p className="text-xs text-[#B8AE98]">
            25+ nafar ofitsiantgacha har biriga alohida 4 xonali PIN kod bering (masalan: Doston — 2100, Sarvinoz — 0800).
          </p>

          <div>
            <label htmlFor="new-waiter-name" className="block text-xs font-medium text-[#E5DEC9]">
              Ismi
            </label>
            <input
              id="new-waiter-name"
              data-testid="new-waiter-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Javohir"
              className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm text-[#F5EDD6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-waiter-pin" className="block text-xs font-medium text-[#E5DEC9]">
                4 xonali Shaxsiy Kod
              </label>
              <input
                id="new-waiter-pin"
                data-testid="new-waiter-pin-input"
                type="text"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="4500"
                className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 font-mono text-sm text-[#E6CB7D]"
              />
            </div>

            <div>
              <label htmlFor="new-waiter-pct" className="block text-xs font-medium text-[#E5DEC9]">
                Shaxsiy % (ixtiyoriy)
              </label>
              <input
                id="new-waiter-pct"
                type="number"
                min={0}
                max={50}
                value={customPercent}
                onChange={(e) => setCustomPercent(e.target.value)}
                placeholder={`${settings.defaultWaiterCommissionPercent}%`}
                className="mt-1 w-full rounded-md border border-[#C9A84C]/25 bg-[#0A0806] px-3 py-2 text-sm tabular-nums text-[#F5EDD6]"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-[#F0A495]">{formError}</p>}

          <button
            type="submit"
            data-testid="add-waiter-submit-btn"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#C9A84C] px-4 py-2.5 text-xs font-bold text-[#0A0806] hover:bg-[#E6CB7D] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{saving ? 'Qo‘shilmoqda...' : 'Ofitsiantni qo‘shish'}</span>
          </button>
        </form>

        {/* Active Waiters Roster */}
        <div className="rounded-xl border border-[#C9A84C]/25 bg-[#14100C] p-5 sm:p-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C9A84C]/18 pb-4">
            <div>
              <h3 className="font-display text-2xl font-semibold text-[#F5EDD6]">
                Ofitsiantlar Ro‘yxati ({waiters.length} ta · 25+ sig‘imli server)
              </h3>
              <p className="text-xs text-[#B8AE98]">
                Oshpaz kodi: <span className="font-mono text-[#E6CB7D]">0500</span> · Kassir kodi:{' '}
                <span className="font-mono text-[#E6CB7D]">0900</span> · Admin:{' '}
                <span className="font-mono text-[#E6CB7D]">sayqal2024</span>
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-[#C9A84C]/12">
            {waiters.map((w) => {
              const effectivePct =
                typeof w.commissionPercent === 'number'
                  ? w.commissionPercent
                  : settings.defaultWaiterCommissionPercent;
              return (
                <div
                  key={w.id}
                  data-testid={`roster-waiter-${w.pinCode}`}
                  className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#C9A84C]/35 bg-[#0A0806] font-mono text-sm font-bold text-[#E6CB7D]"
                    >
                      {w.pinCode}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#F5EDD6]">{w.name}</p>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            w.active
                              ? 'bg-[#2D4A3E]/40 text-[#A9CEBE]'
                              : 'bg-[#8B3A2A]/30 text-[#F0A495]'
                          }`}
                        >
                          {w.active ? 'Faol' : 'To‘xtatilgan'}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#B8AE98]">
                        <KeyRound className="h-3 w-3 text-[#C9A84C]" />
                        <span>Shaxsiy kod: {w.pinCode}</span>
                        <span>·</span>
                        <span>Ulush: {effectivePct}%</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onImpersonateWaiter && w.active && (
                      <button
                        type="button"
                        onClick={() => onImpersonateWaiter(w)}
                        className="inline-flex items-center gap-1 rounded border border-[#C9A84C]/40 bg-[#0A0806] px-2.5 py-1.5 text-xs font-medium text-[#E6CB7D] hover:bg-[#C9A84C] hover:text-[#0A0806]"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Kabinetini ochish</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onUpdateWaiter(w.id, { active: !w.active })}
                      className="rounded border border-[#C9A84C]/25 bg-[#0A0806] px-2.5 py-1.5 text-xs text-[#E5DEC9] hover:border-[#C9A84C]"
                    >
                      {w.active ? 'Bloklash' : 'Faollashtirish'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteWaiter(w.id)}
                      aria-label={`Delete waiter ${w.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded border border-[#8B3A2A]/50 text-[#E88473] hover:bg-[#8B3A2A]/25"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
