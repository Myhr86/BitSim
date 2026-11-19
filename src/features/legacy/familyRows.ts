import type { GameState, Person } from '@/types/game';

function uniq(list: (Person | undefined)[]): Person[] {
  const seen = new Set<string>();
  const out: Person[] = [];
  for (const p of list) {
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

export function buildRows(s: GameState): { label: string; people: Person[] }[] {
  const me = s.people[s.playerId];
  const get = (id?: string) => (id ? s.people[id] : undefined);
  const parents = uniq([get(me.motherId), get(me.fatherId)]);
  const grandparents = uniq(parents.flatMap((p) => [get(p.motherId), get(p.fatherId)]));
  const siblings = uniq(parents.flatMap((p) => p.childrenIds.map((id) => get(id)))).filter((p) => p.id !== me.id);
  const partner = get(me.spouseId);
  const children = uniq(me.childrenIds.map((id) => get(id)));
  const grandchildren = uniq(children.flatMap((c) => c.childrenIds.map((id) => get(id))));
  const rows = [
    { label: 'Besteforeldre', people: grandparents },
    { label: 'Foreldre', people: parents },
    { label: 'Deg og søsken', people: uniq([me, partner, ...siblings]) },
    { label: 'Barn', people: children },
    { label: 'Barnebarn', people: grandchildren },
  ];
  return rows.filter((r) => r.people.length > 0);
}
