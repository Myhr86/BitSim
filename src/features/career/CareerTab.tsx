import { useMemo, useState } from 'react';
import { useGame } from '@/store/gameStore';
import { useGameState } from '@/hooks/useGameData';
import { Bar, Button, Card, Empty, Money, Pill, Row, SectionTitle, Segmented } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { getOccupation, occupationTitle, type OccupationDef } from '@/data/occupations';
import { getProgram, gradeFromPerformance } from '@/data/education';
import { actions } from '@/engine/simulation/actions';
import { availablePrograms, levelName } from '@/engine/education/education';
import { canRetire, hireChance, jobListings, qualification } from '@/engine/careers/careers';
import { playerAge } from '@/engine/simulation/helpers';
import { BALANCE } from '@/data/balance';
import { CRIME_NAMES } from '@/engine/crime/crime';
import { t } from '@/i18n';

const CAT_LABEL: Record<string, string> = {
  health: 'Helse', tech: 'Teknologi', education: 'Undervisning', trades: 'Håndverk', service: 'Service', finance: 'Økonomi og salg', law: 'Juss',
  public: 'Offentlig', creative: 'Kreativt', science: 'Forskning', transport: 'Transport', industry: 'Industri', sport: 'Idrett', politics: 'Politikk',
  military: 'Forsvaret', parttime: 'Deltid',
};

export function CareerTab() {
  const s = useGameState();
  const age = playerAge(s);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  if (age < 6) return <Empty icon="baby" text="Karrieren får vente – nå er det lek og barnehage som gjelder." />;
  return (
    <div>
      <EducationCard onApply={() => setStudyOpen(true)} />
      <JobCard onFind={() => setJobsOpen(true)} />
      <History />
      <JobsSheet open={jobsOpen} onClose={() => setJobsOpen(false)} />
      <StudySheet open={studyOpen} onClose={() => setStudyOpen(false)} />
      <OfferSheet />
    </div>
  );
}

function EducationCard({ onApply }: { onApply: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const enr = s.education.current;
  const prog = enr ? getProgram(enr.programId) : undefined;
  const age = playerAge(s);
  const [confirmDrop, setConfirmDrop] = useState(false);
  return (
    <>
      <SectionTitle action={age >= 16 && !enr && s.crime.prisonYearsLeft === 0 ? <button className="text-[12px] font-bold text-fjord" onClick={onApply}>{t('applyStudy')}</button> : undefined}>
        {t('education')}
      </SectionTitle>
      <Card>
        {enr && prog ? (
          <>
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-soft text-violet">
                <Icon name="graduation-cap" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] font-extrabold leading-tight">{prog.name}</div>
                <div className="text-[12.5px] text-muted">
                  År {Math.min(enr.yearsCompleted + 1, enr.yearsRequired)} av {enr.yearsRequired} · Snitt nå {gradeFromPerformance(enr.performance).toFixed(1).replace('.', ',')}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Meter label={t('progress')} value={(enr.yearsCompleted / enr.yearsRequired) * 100} color="var(--violet)" />
              <Meter label={t('performance')} value={enr.performance} color="var(--fjord)" />
            </div>
            <div className="mt-3 text-[12px] font-bold text-muted">{t('effort')}</div>
            <div className="mt-1">
              <Segmented value={enr.effort} onChange={(e) => act((st) => actions.studyEffort(st, e))} options={[{ value: 'low', label: t('effort_low') }, { value: 'normal', label: t('effort_normal') }, { value: 'high', label: t('effort_high') }]} />
            </div>
            {prog.kind !== 'compulsory' && age >= 16 && (
              <Button size="sm" variant="danger" className="mt-3" icon="door-open" onClick={() => setConfirmDrop(true)}>
                {t('dropOut')}
              </Button>
            )}
          </>
        ) : age < 6 ? (
          <Empty text="Barnehage" />
        ) : (
          <div className="text-[14px] text-muted">{t('noStudy')}</div>
        )}
        {s.education.credentials.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
            {s.education.credentials.map((c, i) => (
              <Pill key={i} tone="violet">
                {getProgram(c.programId)?.name ?? levelName(c.level)} · {c.grade.toFixed(1).replace('.', ',')}
              </Pill>
            ))}
          </div>
        )}
      </Card>
      <Sheet open={confirmDrop} onClose={() => setConfirmDrop(false)} title={t('dropOut')}>
        <p className="text-[14px] text-muted">Er du sikker? Du mister fremdriften i {prog?.name.toLowerCase()}.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={() => setConfirmDrop(false)}>{t('cancel')}</Button>
          <Button
            variant="danger"
            onClick={() => {
              act((st) => actions.dropOut(st));
              setConfirmDrop(false);
            }}
          >
            {t('dropOut')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11.5px] font-bold text-muted">
        <span>{label}</span>
        <span className="tabular">{Math.round(value)}%</span>
      </div>
      <Bar value={value} color={color} />
    </div>
  );
}

function JobCard({ onFind }: { onFind: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const job = s.career.job;
  const occ = job ? getOccupation(job.occupationId) : undefined;
  const age = playerAge(s);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const inPrison = s.crime.prisonYearsLeft > 0;
  return (
    <>
      <SectionTitle action={!inPrison && age >= 13 && !s.career.retired ? <button className="text-[12px] font-bold text-fjord" onClick={onFind}>{t('findJob')}</button> : undefined}>{t('job')}</SectionTitle>
      <Card>
        {job && occ ? (
          <>
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-fjord-soft text-fjord">
                <Icon name="briefcase" size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] font-extrabold leading-tight">{occupationTitle(occ.id, job.level)}</div>
                <div className="text-[12.5px] text-muted">
                  {job.company} · {job.yearsAtCompany} år
                </div>
              </div>
              <div className="text-right">
                <Money value={job.salary} className="text-[15px] font-black" />
                <div className="text-[11px] text-muted">{t('perYear')}</div>
              </div>
            </div>
            <div className="mt-3">
              <Meter label={t('performance')} value={job.performance} color={job.performance < 30 ? 'var(--neg)' : 'var(--fjord)'} />
            </div>
            {occ.ladder.length > 1 && (
              <div className="mt-3 flex gap-1">
                {occ.ladder.map((title, i) => (
                  <div key={title} className="flex-1">
                    <div className={`h-1.5 rounded-full ${i <= job.level ? 'bg-gold' : 'bg-surface-2'}`} />
                    <div className={`mt-1 truncate text-[10px] font-bold ${i === job.level ? 'text-ink' : 'text-faint'}`}>{title}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 text-[12px] font-bold text-muted">{t('effort')}</div>
            <div className="mt-1">
              <Segmented value={job.effort} onChange={(e) => act((st) => actions.workEffort(st, e))} options={[{ value: 'low', label: t('effort_low') }, { value: 'normal', label: t('effort_normal') }, { value: 'high', label: t('effort_high') }]} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" icon="trending-up" onClick={() => act((st) => actions.askRaise(st))} disabled={s.flags.raiseAskedYear === s.year}>
                {t('askRaise')}
              </Button>
              <Button size="sm" variant="danger" icon="door-open" onClick={() => setConfirmQuit(true)}>
                {t('quitJob')}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-[14px] text-muted">{inPrison ? t('inPrison') : s.career.retired ? `${t('retired')} · ${Math.round(s.finances.pensionAnnual).toLocaleString('nb-NO')} kr/år` : t('noJob')}</div>
        )}
        {canRetire(s) && (
          <Button size="sm" variant="fjord" className="mt-3" icon="sunset" onClick={() => act((st) => actions.retire(st))}>
            {t('retire')}
          </Button>
        )}
      </Card>
      <Sheet open={confirmQuit} onClose={() => setConfirmQuit(false)} title={t('quitJob')}>
        <p className="text-[14px] text-muted">Hvis du sier opp selv, får du redusert dagpenger fra NAV.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={() => setConfirmQuit(false)}>{t('cancel')}</Button>
          <Button
            variant="danger"
            onClick={() => {
              act((st) => actions.quitJob(st));
              setConfirmQuit(false);
            }}
          >
            {t('quitJob')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function History() {
  const s = useGameState();
  const past = [...s.career.pastJobs].reverse().slice(0, 8);
  return (
    <>
      {(past.length > 0 || s.crime.records.length > 0 || s.career.militaryDone) && <SectionTitle>{t('pastJobs')}</SectionTitle>}
      {past.length > 0 && (
        <Card className="!py-1">
          {past.map((j, i) => (
            <Row key={i} icon={<Icon name="briefcase" size={17} />} title={occupationTitle(j.occupationId, j.level)} subtitle={`${Math.round(j.years)} år · sluttet ${j.endYear}`} />
          ))}
        </Card>
      )}
      {s.flags.militaryServed ? (
        <Card className="mt-2 !py-1">
          <Row icon={<Icon name="shield" size={17} />} iconTone="fjord" title="Førstegangstjeneste fullført" subtitle={`${s.flags.militaryServed}`} />
        </Card>
      ) : null}
      {s.crime.records.length > 0 && (
        <>
          <SectionTitle>{t('criminalRecord')}</SectionTitle>
          <Card className="!py-1">
            {s.crime.records.map((r, i) => (
              <Row key={i} icon={<Icon name="scale" size={17} />} iconTone="neg" title={CRIME_NAMES[r.crime] ?? r.crime} subtitle={`${r.year} · ${r.sentence}`} />
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function JobsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const [onlyQualified, setOnlyQualified] = useState(true);
  const [detail, setDetail] = useState<OccupationDef | null>(null);
  const listings = useMemo(() => (open ? jobListings(s) : []), [open, s]);
  const rows = listings
    .map((o) => ({ o, q: qualification(s, o) }))
    .filter((x) => !onlyQualified || x.q.ok)
    .sort((a, b) => Number(b.q.ok) - Number(a.q.ok) || b.o.prestige - a.o.prestige);
  const appsLeft = BALANCE.career.maxApplicationsPerYear - s.career.applicationsThisYear;
  return (
    <Sheet open={open} onClose={onClose} title={t('jobListings')} subtitle={`${appsLeft} søknader igjen i år`} tall>
      <Segmented value={onlyQualified ? 'q' : 'all'} onChange={(v) => setOnlyQualified(v === 'q')} options={[{ value: 'q', label: t('qualifiedOnly') }, { value: 'all', label: 'Alle' }]} />
      <div className="mt-2 divide-y divide-line">
        {rows.length === 0 && <Empty icon="search" text="Ingen stillinger du er kvalifisert for akkurat nå. Utdanning og erfaring åpner flere dører." />}
        {rows.map(({ o, q }) => (
          <Row
            key={o.id}
            onClick={() => setDetail(o)}
            icon={<Icon name="briefcase" size={17} />}
            iconTone={q.ok ? 'fjord' : 'neutral'}
            title={o.title}
            subtitle={q.ok ? `${CAT_LABEL[o.category]} · ${Math.round(hireChance(s, o) * 100)} % sjanse` : q.missing[0]}
            right={<Money value={((o.salary[0] + o.salary[1]) / 2) * s.economy.priceIndex} className="text-[13px] font-extrabold" />}
          />
        ))}
      </div>
      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title} subtitle={detail ? CAT_LABEL[detail.category] : ''}>
        {detail && (
          <JobDetail
            occ={detail}
            appsLeft={appsLeft}
            onApply={() => {
              act((st) => actions.applyJob(st, detail.id));
              setDetail(null);
              onClose();
            }}
          />
        )}
      </Sheet>
    </Sheet>
  );
}

function JobDetail({ occ, appsLeft, onApply }: { occ: OccupationDef; appsLeft: number; onApply: () => void }) {
  const s = useGameState();
  const q = qualification(s, occ);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Lønn fra" value={<Money value={occ.salary[0] * s.economy.priceIndex} />} />
        <Stat label="Stress" value={`${occ.stress}`} />
        <Stat label="Prestisje" value={`${occ.prestige}`} />
      </div>
      <div className="mt-3 text-[12px] font-bold text-muted">Karrierestige</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {occ.ladder.map((l) => (
          <Pill key={l}>{l}</Pill>
        ))}
      </div>
      {!q.ok && (
        <div className="mt-3 rounded-2xl bg-neg-soft p-3 text-[13px] text-neg">
          <div className="font-extrabold">Du mangler:</div>
          {q.missing.map((m) => (
            <div key={m}>• {m}</div>
          ))}
        </div>
      )}
      <Button variant="primary" block size="lg" className="mt-4" disabled={!q.ok || appsLeft <= 0} onClick={onApply}>
        {t('apply')} {q.ok ? `· ${Math.round(hireChance(s, occ) * 100)} %` : ''}
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-2.5">
      <div className="text-[13.5px] font-black">{value}</div>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function OfferSheet() {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const offer = s.career.offer;
  const occ = offer ? getOccupation(offer.occupationId) : undefined;
  return (
    <Sheet open={!!offer && !s.pendingEvents.length} dismissable={false} title={t('offer')}>
      {offer && occ && (
        <div>
          <div className="flex items-center gap-3 rounded-2xl bg-fjord-soft p-4">
            <Icon name="briefcase" size={26} className="text-fjord" />
            <div>
              <div className="text-[16px] font-black">{occ.title}</div>
              <div className="text-[13px] text-muted">{offer.company}</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Tilbudt årslønn</div>
            <Money value={offer.salary} className="text-3xl font-black" />
          </div>
          <div className="mt-4 grid gap-2">
            <Button variant="primary" block size="lg" icon="check" onClick={() => act((st) => actions.acceptOffer(st))}>
              {t('accept')}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={offer.negotiated} icon="hand-coins" onClick={() => act((st) => actions.negotiateOffer(st))}>
                {t('negotiate')}
              </Button>
              <Button variant="danger" onClick={() => act((st) => actions.declineOffer(st))}>
                {t('decline')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function StudySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useGameState();
  const act = useGame((x) => x.act);
  const list = useMemo(() => (open ? availablePrograms(s) : []), [open, s]);
  const sorted = [...list].sort((a, b) => Number(b.eligibility.ok) - Number(a.eligibility.ok));
  return (
    <Sheet open={open} onClose={onClose} title={t('applyStudy')} subtitle="Opptak skjer basert på karaktersnitt og evner" tall>
      <div className="divide-y divide-line">
        {sorted.map(({ program, eligibility }) => (
          <Row
            key={program.id}
            disabled={!eligibility.ok}
            onClick={() => {
              act((st) => actions.enroll(st, program.id));
              onClose();
            }}
            icon={<Icon name="graduation-cap" size={17} />}
            iconTone={eligibility.ok ? 'violet' : 'neutral'}
            title={program.name}
            subtitle={eligibility.ok ? `${program.years} år · ${program.description}` : eligibility.reasons[0]}
            right={eligibility.ok ? <Icon name="chevron-right" className="text-faint" /> : <Icon name="lock" size={15} className="text-faint" />}
          />
        ))}
      </div>
    </Sheet>
  );
}
