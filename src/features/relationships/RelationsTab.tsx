import { useState } from 'react';
import { useGame } from '@/store/gameStore';
import { useGameState } from '@/hooks/useGameData';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Bar, Button, Card, Empty, Pill, SectionTitle } from '@/components/ui';
import type { Relationship, RelKind } from '@/types/game';
import { ageOf } from '@/engine/simulation/helpers';
import { availableInteractions } from '@/engine/relationships/interactions';
import { actions } from '@/engine/simulation/actions';
import { getOccupation } from '@/data/occupations';
import { getTrait } from '@/data/traits';
import { formatNOK } from '@/utils/format';
import { t } from '@/i18n';
import { FamilyTreeSheet } from '@/features/legacy/FamilyTree';
import { REL_LABEL } from './labels';

const GROUPS: { title: string; kinds: RelKind[] }[] = [
  { title: t('partner'), kinds: ['spouse', 'partner'] },
  { title: t('family'), kinds: ['mother', 'father', 'sibling', 'child', 'grandchild', 'grandparent'] },
  { title: t('friends'), kinds: ['bestFriend', 'friend'] },
  { title: t('work'), kinds: ['boss', 'coworker'] },
  { title: t('others'), kinds: ['ex', 'enemy'] },
];

export function RelationsTab() {
  const s = useGameState();
  const [selected, setSelected] = useState<string | null>(null);
  const [tree, setTree] = useState(false);
  const all = Object.values(s.relationships);
  const living = all.filter((r) => r.status !== 'deceased' && s.people[r.personId]?.alive);
  const deceased = all.filter((r) => r.status === 'deceased' || !s.people[r.personId]?.alive);
  return (
    <div>
      <Button block icon="git-branch" className="mt-1" onClick={() => setTree(true)}>
        {t('familyTree')}
      </Button>
      {GROUPS.map((g) => {
        const list = living.filter((r) => g.kinds.includes(r.kind)).sort((a, b) => g.kinds.indexOf(a.kind) - g.kinds.indexOf(b.kind) || b.strength - a.strength);
        if (list.length === 0 && g.title !== t('friends')) return null;
        return (
          <section key={g.title}>
            <SectionTitle>{g.title}</SectionTitle>
            <Card className="!px-3 !py-1">
              {list.length === 0 ? <Empty icon="users" text={t('noRelations')} /> : list.map((r) => <RelRow key={r.personId} r={r} onClick={() => setSelected(r.personId)} />)}
            </Card>
          </section>
        );
      })}
      {deceased.length > 0 && (
        <section>
          <SectionTitle>{t('deceased')}</SectionTitle>
          <Card className="!px-3 !py-1">
            {deceased.slice(0, 20).map((r) => (
              <RelRow key={r.personId} r={r} />
            ))}
          </Card>
        </section>
      )}
      <RelationSheet personId={selected} onClose={() => setSelected(null)} />
      <FamilyTreeSheet open={tree} onClose={() => setTree(false)} />
    </div>
  );
}

function RelRow({ r, onClick }: { r: Relationship; onClick?: () => void }) {
  const s = useGameState();
  const p = s.people[r.personId];
  if (!p) return null;
  const age = ageOf(s, p);
  const dead = !p.alive;
  const color = r.kind === 'enemy' ? 'var(--neg)' : r.strength >= 70 ? 'var(--pos)' : r.strength >= 40 ? 'var(--gold)' : 'var(--neg)';
  return (
    <button onClick={onClick} disabled={!onClick} className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-70">
      <Avatar look={p.appearanceLook} gender={p.gender} age={age} size={44} dead={dead} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-bold">
            {p.firstName} {p.lastName}
          </span>
        </div>
        <div className="text-[12px] text-muted">
          {REL_LABEL[r.kind]} · {age} år{dead ? ` · ✝ ${p.deathYear}` : ''}
          {r.status === 'estranged' && ' · Brutt kontakt'}
        </div>
        {!dead && <Bar value={r.strength} color={color} className="mt-1.5" height={4} />}
      </div>
      {onClick && <Icon name="chevron-right" className="text-faint" />}
    </button>
  );
}

function RelationSheet({ personId, onClose }: { personId: string | null; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const r = personId ? s.relationships[personId] : undefined;
  const p = personId ? s.people[personId] : undefined;
  if (!r || !p) return <Sheet open={false}>{null}</Sheet>;
  const age = ageOf(s, p);
  const options = availableInteractions(s, r);
  const occ = p.occupationId ? getOccupation(p.occupationId)?.title : undefined;
  const romantic = r.kind === 'partner' || r.kind === 'spouse';
  return (
    <Sheet open onClose={onClose} title={`${p.firstName} ${p.lastName}`} subtitle={`${REL_LABEL[r.kind]} · ${age} år${occ ? ` · ${occ}` : ''}`}>
      <div className="flex items-center gap-4">
        <Avatar look={p.appearanceLook} gender={p.gender} age={age} size={72} />
        <div className="flex-1 space-y-2">
          <MiniStat label={t('closeness')} value={r.strength} color="var(--pos)" />
          <MiniStat label={t('trust')} value={r.trust} color="var(--fjord)" />
          {romantic && <MiniStat label={t('attractionStat')} value={r.attraction} color="var(--berry)" />}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.traits.map((tr) => (
          <Pill key={tr} tone="violet">
            {getTrait(tr)?.name}
          </Pill>
        ))}
        <Pill>Helse {Math.round(p.stats.health)}</Pill>
        <Pill>Lykke {Math.round(p.stats.happiness)}</Pill>
        {r.owes > 0 && <Pill tone="gold">{t('owesYou', { amount: formatNOK(r.owes) })}</Pill>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => act((st) => actions.interact(st, p.id, o.id))}
            className={`flex min-h-[54px] items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] font-bold transition active:scale-[0.97] ${o.danger ? 'bg-neg-soft text-neg' : 'bg-surface-2'}`}
          >
            <Icon name={o.icon} size={17} className="shrink-0" />
            <span className="leading-tight">
              {o.label}
              {o.cost ? <span className="block text-[11px] font-semibold text-gold">{formatNOK(o.cost * s.economy.priceIndex)}</span> : null}
            </span>
          </button>
        ))}
      </div>
      {options.length === 0 && <Empty text="Ingen handlinger tilgjengelig." />}
    </Sheet>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[11.5px] font-bold text-muted">
        <span>{label}</span>
        <span className="tabular">{Math.round(value)}</span>
      </div>
      <Bar value={value} color={color} />
    </div>
  );
}
