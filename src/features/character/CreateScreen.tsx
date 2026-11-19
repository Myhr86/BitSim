import { useMemo, useState } from 'react';
import { useGame } from '@/store/gameStore';
import { randomLifeOptions, type NewLifeOptions } from '@/engine/simulation/createGame';
import { randomSeed } from '@/engine/probability/rng';
import { getCountry } from '@/data/countries';
import { TRAITS } from '@/data/traits';
import { SCENARIOS } from '@/engine/achievements/definitions';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { Button, Card, Segmented, SectionTitle } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import type { FamilyBackground, Gender, TraitId } from '@/types/core';
import { createRng } from '@/engine/probability/rng';
import { randomFirstName, randomLastName } from '@/engine/npcs/factory';
import { t } from '@/i18n';

const SKIN = ['#f6d7c3', '#efc3a4', '#d9a07a', '#b97850', '#8d5a3b', '#5e3b26'];
const HAIR = ['#2b1d16', '#5a3a22', '#8a5a2f', '#c99a52', '#e8cf8a', '#a2361e', '#1a1a1a'];
const BACKGROUNDS: FamilyBackground[] = ['middle', 'working', 'wealthy', 'single', 'difficult'];
const BG_ICON: Record<FamilyBackground, string> = { wealthy: 'gem', middle: 'home', working: 'hammer', single: 'heart', difficult: 'cloud-rain' };

export function CreateScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const newGame = useGame((s) => s.newGame);
  const slots = useGame((s) => s.slots);
  const lastSlot = useGame((s) => s.slot);
  const achievements = useGame((s) => s.meta.achievements);
  const [opts, setOpts] = useState<NewLifeOptions>(() => randomLifeOptions());
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const country = getCountry('no');
  const set = (patch: Partial<NewLifeOptions>) => setOpts((o) => ({ ...o, ...patch }));
  const reroll = () => setOpts(randomLifeOptions());
  const rerollName = (part: 'first' | 'last') => {
    const rng = createRng(randomSeed());
    if (part === 'first') set({ firstName: randomFirstName(rng, opts.gender) });
    else set({ lastName: randomLastName(rng) });
  };
  const targetSlot = useMemo(() => slots.find((s) => s.empty)?.slot ?? lastSlot, [slots, lastSlot]);
  const overwriting = !slots.find((s) => s.slot === targetSlot)?.empty && slots.length > 0;

  const toggleTrait = (id: TraitId) => {
    const has = opts.traits.includes(id);
    if (has) return set({ traits: opts.traits.filter((x) => x !== id) });
    const opposite = TRAITS.find((x) => x.id === id)?.opposite;
    const next = opts.traits.filter((x) => x !== opposite);
    if (next.length >= 2) next.shift();
    set({ traits: [...next, id] });
  };

  const born = () => {
    if (overwriting && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    void newGame({ ...opts, seed: randomSeed() }, targetSlot);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 px-4 pb-2" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <button onClick={() => setScreen('menu')} className="grid h-10 w-10 place-items-center rounded-full bg-surface shadow-[var(--shadow-card)] active:scale-95" aria-label={t('back')}>
          <Icon name="chevron-left" />
        </button>
        <h1 className="flex-1 text-lg font-extrabold">{t('createTitle')}</h1>
        <Button size="sm" icon="dice-5" onClick={reroll}>
          {t('randomize')}
        </Button>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-32">
        <Card className="mt-2 flex items-center gap-4">
          <Avatar look={opts.look} gender={opts.gender} age={24} size={84} />
          <div className="min-w-0 flex-1 space-y-2">
            <NameInput label={t('firstName')} value={opts.firstName} onChange={(firstName) => set({ firstName })} onDice={() => rerollName('first')} />
            <NameInput label={t('lastName')} value={opts.lastName} onChange={(lastName) => set({ lastName })} onDice={() => rerollName('last')} />
          </div>
        </Card>

        <SectionTitle>{t('gender')}</SectionTitle>
        <Segmented<Gender>
          value={opts.gender}
          onChange={(gender) => set({ gender, datingPreference: gender === 'male' ? 'female' : 'male' })}
          options={[
            { value: 'female', label: t('female') },
            { value: 'male', label: t('male') },
          ]}
        />

        <SectionTitle>{t('look')}</SectionTitle>
        <Card className="space-y-3">
          <Swatches label={t('skin')} colors={SKIN} value={opts.look.skin} onChange={(skin) => set({ look: { ...opts.look, skin } })} />
          <Swatches label={t('hair')} colors={HAIR} value={opts.look.hair} onChange={(hair) => set({ look: { ...opts.look, hair } })} />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-muted">{t('hairStyle')}</span>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <button key={i} onClick={() => set({ look: { ...opts.look, hairStyle: i } })} className={`h-9 w-9 rounded-xl text-[13px] font-bold ${opts.look.hairStyle === i ? 'bg-ink text-bg' : 'bg-surface-2 text-muted'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <SectionTitle>{t('birthplace')}</SectionTitle>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {country.cities.map((c) => (
            <button key={c.id} onClick={() => set({ cityId: c.id })} className={`shrink-0 rounded-2xl px-3.5 py-2 text-[13px] font-bold transition ${opts.cityId === c.id ? 'bg-fjord text-white dark:text-[#0b1f1a]' : 'bg-surface text-ink shadow-[var(--shadow-card)]'}`}>
              {c.name}
            </button>
          ))}
        </div>

        <SectionTitle>{t('startYear')}</SectionTitle>
        <Card className="flex items-center justify-between !py-3">
          <span className="font-bold">Nåtid</span>
          <span className="tabular font-extrabold text-muted">{opts.startYear}</span>
        </Card>

        <SectionTitle>{t('background')}</SectionTitle>
        <div className="grid grid-cols-1 gap-2">
          {BACKGROUNDS.map((b) => (
            <button key={b} onClick={() => set({ background: b })} className={`flex items-center gap-3 rounded-2xl p-3 text-left transition ${opts.background === b ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface shadow-[var(--shadow-card)]'}`}>
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${opts.background === b ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted'}`}>
                <Icon name={BG_ICON[b]} size={19} />
              </div>
              <div>
                <div className="text-[14.5px] font-extrabold">{t(`bg_${b}`)}</div>
                <div className="text-[12.5px] text-muted">{t(`bg_${b}_desc`)}</div>
              </div>
            </button>
          ))}
        </div>

        <SectionTitle>{t('traits')}</SectionTitle>
        <p className="-mt-1 mb-2 px-1 text-[12px] text-muted">{t('traitsHint')}</p>
        <div className="flex flex-wrap gap-2">
          {TRAITS.map((tr) => {
            const on = opts.traits.includes(tr.id);
            return (
              <button key={tr.id} onClick={() => toggleTrait(tr.id)} className={`rounded-full px-3.5 py-2 text-[13px] font-bold transition ${on ? 'bg-violet text-white dark:text-[#120f24]' : 'bg-surface text-ink shadow-[var(--shadow-card)]'}`} title={tr.description}>
                {tr.name}
              </button>
            );
          })}
        </div>
        {opts.traits.length > 0 && (
          <p className="mt-2 px-1 text-[12px] text-muted">{opts.traits.map((id) => TRAITS.find((x) => x.id === id)?.description).join(' ')}</p>
        )}

        <SectionTitle>{t('attraction')}</SectionTitle>
        <Segmented
          value={opts.datingPreference}
          onChange={(datingPreference) => set({ datingPreference })}
          options={[
            { value: 'male', label: t('attractedMen') },
            { value: 'female', label: t('attractedWomen') },
            { value: 'any', label: t('attractedAny') },
          ]}
        />

        <SectionTitle>{t('difficulty')}</SectionTitle>
        <Segmented
          value={opts.difficulty}
          onChange={(difficulty) => set({ difficulty })}
          options={[
            { value: 'easy', label: t('diff_easy') },
            { value: 'normal', label: t('diff_normal') },
            { value: 'hard', label: t('diff_hard') },
          ]}
        />

        <SectionTitle>{t('scenario')}</SectionTitle>
        <div className="grid grid-cols-1 gap-2">
          {SCENARIOS.map((sc) => {
            const locked = !!sc.unlockedBy && !achievements[sc.unlockedBy];
            const on = opts.scenario === sc.id;
            return (
              <button key={sc.id} disabled={locked} onClick={() => set({ scenario: sc.id })} className={`flex items-center gap-3 rounded-2xl p-3 text-left transition disabled:opacity-60 ${on ? 'bg-gold-soft ring-2 ring-gold' : 'bg-surface shadow-[var(--shadow-card)]'}`}>
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${on ? 'bg-gold text-white' : 'bg-surface-2 text-muted'}`}>
                  <Icon name={locked ? 'lock' : 'star'} size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[14.5px] font-extrabold">{sc.name}</div>
                  <div className="text-[12.5px] text-muted">{locked ? 'Låses opp med en skjult prestasjon.' : sc.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg to-transparent px-4 pt-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <Button variant="primary" size="lg" block icon="baby" onClick={born} disabled={!opts.firstName.trim() || !opts.lastName.trim()}>
          {t('beBorn')}
        </Button>
      </div>

      <Sheet open={confirmOverwrite} onClose={() => setConfirmOverwrite(false)} title="Overskrive lagring?">
        <p className="text-[14px] text-muted">Alle lagringsplassene er i bruk. Det nye livet vil erstatte lagringen i plass {targetSlot + 1}.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={() => setConfirmOverwrite(false)}>{t('cancel')}</Button>
          <Button variant="primary" onClick={() => void newGame({ ...opts, seed: randomSeed() }, targetSlot)}>
            {t('confirm')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function NameInput({ label, value, onChange, onDice }: { label: string; value: string; onChange: (v: string) => void; onDice: () => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-surface-2 pl-3">
      <span className="sr-only">{label}</span>
      <input value={value} maxLength={20} placeholder={label} onChange={(e) => onChange(e.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-[15px] font-bold outline-none placeholder:text-faint" />
      <button type="button" onClick={onDice} className="grid h-10 w-10 place-items-center text-muted active:scale-90" aria-label={`${t('randomize')} ${label}`}>
        <Icon name="dice-5" size={17} />
      </button>
    </label>
  );
}

function Swatches({ label, colors, value, onChange }: { label: string; colors: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-bold text-muted">{label}</span>
      <div className="flex gap-1.5">
        {colors.map((c, i) => (
          <button key={c} onClick={() => onChange(i)} className={`h-8 w-8 rounded-full border-2 transition ${value === i ? 'scale-110 border-ink' : 'border-transparent'}`} style={{ background: c }} aria-label={`${label} ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
