import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/store/gameStore';
import { useGameState } from '@/hooks/useGameData';
import { Avatar } from '@/components/Avatar';
import { Button, Card, Money, SectionTitle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { heirs } from '@/engine/legacy/legacy';
import { levelName } from '@/engine/education/education';
import { ageOf } from '@/engine/simulation/helpers';
import { FamilyTreeSheet } from './FamilyTree';
import { t } from '@/i18n';

export function DeathScreen() {
  const s = useGameState();
  const continueAs = useGame((x) => x.continueAs);
  const quit = useGame((x) => x.quitToMenu);
  const setScreen = useGame((x) => x.setScreen);
  const [tree, setTree] = useState(false);
  const d = s.death;
  if (!d) return null;
  const p = s.people[s.playerId];
  const sum = d.summary;
  const kids = heirs(s);
  const happy = s.happinessLog;
  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-10" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col items-center pt-6 text-center">
        <Avatar look={p.appearanceLook} gender={p.gender} age={d.age} size={104} dead />
        <h1 className="mt-4 text-3xl font-black tracking-tight">{sum.name}</h1>
        <p className="mt-1 text-[15px] font-semibold text-muted">
          {sum.birthYear} – {sum.deathYear} · {t('ageAtDeath', { n: d.age })}
        </p>
        <p className="mt-0.5 text-[13px] text-faint">
          {t('causeOfDeath')}: {sum.cause}
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">
            <Icon name="flower" size={14} /> {t('obituary')}
          </div>
          <p className="text-[15px] leading-relaxed">{sum.obituary}</p>
        </Card>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Fact label={t('legacyScore')} value={<span className="text-violet">{sum.legacyScore}</span>} />
          <Fact label={t('netWorth')} value={<Money value={sum.netWorth} />} />
          <Fact label={t('lifetimeEarnings')} value={<Money value={sum.lifetimeEarnings} />} />
          <Fact label={t('avgHappiness')} value={`${sum.avgHappiness}`} />
          <Fact label={t('highestEducation')} value={levelName(sum.highestEducation)} />
          <Fact label={t('careerPeak')} value={sum.peakTitle ?? '–'} />
          <Fact label={t('childrenCount')} value={`${sum.children}`} />
          <Fact label={t('grandchildrenCount')} value={`${sum.grandchildren}`} />
        </div>

        {happy.length > 4 && (
          <Card className="mt-3 !p-3">
            <div className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-muted">Lykke gjennom livet</div>
            <svg viewBox="0 0 320 70" className="h-16 w-full" preserveAspectRatio="none" aria-label="Lykke gjennom livet">
              <polyline
                points={happy.map((v, i) => `${(i / (happy.length - 1)) * 320},${70 - (v / 100) * 70}`).join(' ')}
                fill="none"
                stroke="var(--gold)"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </Card>
        )}

        {sum.highlights.length > 0 && (
          <>
            <SectionTitle>{t('highlights')}</SectionTitle>
            <Card className="space-y-2">
              {sum.highlights.map((h, i) => (
                <div key={i} className="flex gap-2 text-[14px]">
                  <Icon name="star" size={15} className="mt-0.5 shrink-0 text-gold" />
                  <span>{h}</span>
                </div>
              ))}
            </Card>
          </>
        )}

        <SectionTitle>{t('continueAs')}</SectionTitle>
        {kids.length === 0 ? (
          <Card>
            <p className="text-[14px] text-muted">{t('noHeirs')}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {kids.map((k) => (
              <Card key={k.id} onClick={() => continueAs(k.id)} className="!p-3">
                <div className="flex items-center gap-3">
                  <Avatar look={k.appearanceLook} gender={k.gender} age={ageOf(s, k)} size={48} />
                  <div className="flex-1">
                    <div className="text-[15px] font-extrabold">
                      {k.firstName} {k.lastName}
                    </div>
                    <div className="text-[12.5px] text-muted">{ageOf(s, k)} år · arver sin del av {Math.round(d.estate / 1000).toLocaleString('nb-NO')} 000 kr</div>
                  </div>
                  <Icon name="chevron-right" className="text-faint" />
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-2">
          <Button block icon="git-branch" onClick={() => setTree(true)}>
            {t('familyTree')}
          </Button>
          <Button variant="primary" block size="lg" icon="sparkles" onClick={() => setScreen('create')}>
            {t('newLife')}
          </Button>
          <Button block variant="ghost" onClick={quit}>
            {t('toMenu')}
          </Button>
        </div>
      </motion.div>
      <FamilyTreeSheet open={tree} onClose={() => setTree(false)} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-card)]">
      <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 truncate text-[15px] font-black">{value}</div>
    </div>
  );
}
