import { useState } from 'react';
import { Sheet } from '@/components/Sheet';
import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/ui';
import { useGameState } from '@/hooks/useGameData';
import type { GameState, Person } from '@/types/game';
import { ageOf } from '@/engine/simulation/helpers';
import { getOccupation } from '@/data/occupations';
import { buildRows } from './familyRows';

/**
 * Generational family tree centred on the current character: grandparents, parents,
 * you and siblings, children and grandchildren. Tap a person for details.
 */
export function FamilyTreeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useGameState();
  const [focus, setFocus] = useState<Person | null>(null);
  const rows = buildRows(s);
  return (
    <Sheet open={open} onClose={onClose} title="Slektstre" subtitle={`Generasjon ${s.generation}`} tall>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">{row.label}</div>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {row.people.map((p) => (
                <PersonChip key={p.id} s={s} p={p} me={p.id === s.playerId} onClick={() => setFocus(p)} />
              ))}
            </div>
          </div>
        ))}
        {s.lineage.length > 0 && (
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">Tidligere generasjoner du har spilt</div>
            <div className="space-y-2">
              {s.lineage.map((l) => (
                <div key={l.personId} className="rounded-2xl bg-surface-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold">{l.name}</span>
                    <Pill tone="violet">Gen. {l.generation}</Pill>
                  </div>
                  <div className="text-[12.5px] text-muted">
                    {l.birthYear}–{l.deathYear} · {l.ageAtDeath} år · {l.peakTitle ?? 'Ingen karriere'} · {l.legacyScore} poeng
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Sheet open={!!focus} onClose={() => setFocus(null)} title={focus ? `${focus.firstName} ${focus.lastName}` : ''}>
        {focus && (
          <div className="flex items-center gap-4">
            <Avatar look={focus.appearanceLook} gender={focus.gender} age={ageOf(s, focus)} size={72} dead={!focus.alive} />
            <div className="text-[14px] leading-relaxed">
              <div>
                Født {focus.birthYear}
                {focus.alive ? ` · ${ageOf(s, focus)} år` : ` · død ${focus.deathYear} (${focus.deathCause ?? 'ukjent'})`}
              </div>
              {focus.occupationId && <div className="text-muted">{getOccupation(focus.occupationId)?.title}</div>}
              <div className="text-muted">{focus.childrenIds.length} barn</div>
              {focus.playedGeneration && <Pill tone="violet">Spilt generasjon {focus.playedGeneration}</Pill>}
            </div>
          </div>
        )}
      </Sheet>
    </Sheet>
  );
}

function PersonChip({ s, p, me, onClick }: { s: GameState; p: Person; me: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-[84px] shrink-0 flex-col items-center rounded-2xl p-2 text-center transition active:scale-95 ${me ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface-2'}`}>
      <Avatar look={p.appearanceLook} gender={p.gender} age={ageOf(s, p)} size={48} dead={!p.alive} />
      <div className="mt-1 w-full truncate text-[12px] font-extrabold">{p.firstName}</div>
      <div className="text-[10.5px] text-muted">{p.alive ? `${ageOf(s, p)} år` : `✝ ${p.deathYear}`}</div>
    </button>
  );
}

