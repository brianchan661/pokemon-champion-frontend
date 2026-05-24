import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon, MoveCategory } from '@/components/UI/MoveCategoryIcon';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getApiBaseUrl } from '@/config/api';
import { PieChart, Pie, Tooltip } from 'recharts';

const API_URL = getApiBaseUrl();

interface MoveEntry {
  rank: number;
  name: string;
  percentage: string;
  move_identifier: string | null;
  move_type: string | null;
  move_category: string | null;
}

interface ItemEntry {
  rank: number;
  name: string;
  percentage: string;
  item_identifier: string | null;
  item_sprite: string | null;
}

interface NatureEntry {
  rank: number;
  name: string;
  percentage: string;
  increased_stat: string | null;
  decreased_stat: string | null;
}

interface EvSpreadEntry {
  rank: number;
  percentage: string;
  hp: number;
  attack: number;
  defense: number;
  sp_atk: number;
  sp_def: number;
  speed: number;
}

interface TeammateEntry {
  rank: number;
  name: string;
  teammate_slug: string | null;
  teammate_image: string | null;
  teammate_type1: string | null;
  teammate_type2: string | null;
}

interface AbilityEntry {
  rank: number;
  name: string;
  percentage: string;
  ability_identifier: string | null;
}

interface RankingDetail {
  rank: number;
  pokemonName: string;
  pokemonId: number;
  nameLower: string | null;
  imageUrl: string | null;
  type1: string | null;
  type2: string | null;
  season: string;
  format: string;
  moves: MoveEntry[];
  items: ItemEntry[];
  natures: NatureEntry[];
  abilities: AbilityEntry[];
  teammates: TeammateEntry[];
  evSpreads: EvSpreadEntry[];
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP', attack: 'Atk', defense: 'Def', sp_atk: 'SpA', sp_def: 'SpD', speed: 'Spe',
};

function StatPill({
  rank,
  iconContent,
  nameContent,
  percentage,
  col1Content,
  col2Content,
}: {
  rank: number;
  iconContent?: React.ReactNode;
  nameContent: React.ReactNode;
  percentage: string;
  col1Content?: React.ReactNode;
  col2Content?: React.ReactNode;
}) {
  const pctNum = parseFloat(percentage);
  const hasExtraCols = col1Content !== undefined || col2Content !== undefined;
  return (
    <div
      className="relative flex w-full items-center h-8 px-2.5 rounded-lg group overflow-hidden transition-all border"
      style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/20 group-hover:from-blue-500/20 group-hover:to-indigo-500/30 transition-all duration-300 ease-out"
        style={{ width: `${pctNum}%` }}
      />
      <div
        className="relative z-10 grid items-center w-full gap-x-2"
        style={{
          gridTemplateColumns: hasExtraCols
            ? '12px auto 1fr 36px 36px 44px'
            : '12px auto 1fr 44px',
        }}
      >
        <span className="text-[10px] font-mono text-center" style={{ color: 'var(--color-text-tertiary)' }}>{rank}</span>
        <div className="flex items-center gap-1.5">{iconContent ?? <span />}</div>
        <div className="text-xs font-medium truncate min-w-0 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
          {nameContent}
        </div>
        {hasExtraCols && (
          <>
            <div className="text-[10px] font-medium text-right">{col1Content ?? null}</div>
            <div className="text-[10px] font-medium text-right">{col2Content ?? null}</div>
          </>
        )}
        <div className="text-[11px] font-mono font-bold tracking-wide text-blue-500 dark:text-blue-300 bg-blue-500/10 px-1.5 py-[1px] rounded text-center">
          {pctNum.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2 px-1">
      <span className="text-xs font-bold tracking-[0.2em]" style={{ color: 'var(--color-text-tertiary)' }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
    </div>
  );
}

const PIE_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

const PIE_SIZE = 160;
const PIE_CX = PIE_SIZE / 2;
const PIE_CY = PIE_SIZE / 2;
const OUTER_R = 72;
const INNER_R = 42;
const PAD_ANGLE = 2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function computeSlices(data: { value: number }[]) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const slices: { startAngle: number; endAngle: number; midAngle: number }[] = [];
  let cursor = 0;
  for (const d of data) {
    const sweep = (d.value / total) * (360 - PAD_ANGLE * data.length);
    const start = cursor;
    const end = cursor + sweep;
    slices.push({ startAngle: start, endAngle: end, midAngle: (start + end) / 2 });
    cursor = end + PAD_ANGLE;
  }
  return slices;
}

function UsagePieChart({ data, activeIndex, onActiveIndexChange }: {
  data: { name: string; value: number; icon?: string }[];
  activeIndex: number | null;
  onActiveIndexChange: (i: number | null) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: PIE_SIZE, height: PIE_SIZE }} />;

  const slices = computeSlices(data);
  const midR = (INNER_R + OUTER_R) / 2;
  const thickness = OUTER_R - INNER_R;

  const colored = data.map((d, i) => ({
    ...d,
    fill: PIE_COLORS[i % PIE_COLORS.length],
    opacity: activeIndex === null || activeIndex === i ? 1 : 0.25,
  }));

  const icons = slices.map((s, i) => {
    const entry = data[i];
    if (!entry?.icon) return null;
    const arcLen = Math.abs((s.endAngle - s.startAngle) * Math.PI / 180) * midR;
    const iconSize = Math.min(arcLen * 0.8, thickness - 4);
    if (iconSize < 10) return null;
    const { x, y } = polarToCartesian(PIE_CX, PIE_CY, midR, s.midAngle);
    const half = iconSize / 2;
    return (
      <image
        key={i}
        href={entry.icon}
        x={x - half}
        y={y - half}
        width={iconSize}
        height={iconSize}
        style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
      />
    );
  });

  return (
    <div style={{ position: 'relative', width: PIE_SIZE, height: PIE_SIZE }}>
      <PieChart width={PIE_SIZE} height={PIE_SIZE}>
        <Pie
          data={colored}
          cx={PIE_CX}
          cy={PIE_CY}
          innerRadius={INNER_R}
          outerRadius={OUTER_R}
          paddingAngle={PAD_ANGLE}
          dataKey="value"
          onMouseEnter={(_, index) => onActiveIndexChange(index)}
          onMouseLeave={() => onActiveIndexChange(null)}
          strokeWidth={0}
          style={{ outline: 'none' }}
          startAngle={90}
          endAngle={-270}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const entry = payload[0];
            const icon = (entry.payload as { icon?: string }).icon;
            return (
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                {icon && <img src={icon} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />}
                <span>{entry.name}: {(entry.value as number).toFixed(1)}%</span>
              </div>
            );
          }}
        />
      </PieChart>
      <svg
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        width={PIE_SIZE}
        height={PIE_SIZE}
      >
        {icons}
      </svg>
    </div>
  );
}

export default function RankingDetailPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const locale = router.locale || 'en';
  const { season, format, slug } = router.query as { season?: string; format?: string; slug?: string };
  const [itemActiveIndex, setItemActiveIndex] = useState<number | null>(null);
  const [natureActiveIndex, setNatureActiveIndex] = useState<number | null>(null);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['ranking-detail', season, format, slug, locale],
    queryFn: async (): Promise<RankingDetail> => {
      const res = await axios.get(`${API_URL}/rankings/${slug}?season=${season}&format=${format}&lang=${locale}`);
      return res.data.data;
    },
    enabled: !!slug && !!season && !!format,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const rankColor = detail
    ? detail.rank === 1 ? '#f59e0b' : detail.rank === 2 ? '#94a3b8' : detail.rank === 3 ? '#d97706' : undefined
    : undefined;

  return (
    <Layout>
      <div className="min-h-screen py-8" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back */}
          <Link
            href="/ranking"
            className="inline-flex items-center gap-1 text-sm mb-6 transition-colors hover:text-blue-500"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('ranking.backToList', { season: season ?? 'M1' })}
          </Link>

          {isLoading ? (
            <div className="space-y-3">
              {[112, 280, 200].map((h, i) => (
                <div key={i} className="rounded-xl animate-pulse" style={{ height: h, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl p-4 text-red-500" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              Failed to load ranking data.
            </div>
          ) : detail ? (
            <div className="space-y-3">

              {/* Hero */}
              <div className="relative rounded-2xl p-6 overflow-hidden shadow-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-6">
                  <div className="shrink-0">
                    {detail.nameLower ? (
                      <Link href={`/pokemon/${detail.nameLower}`}>
                        <img src={detail.imageUrl ?? ''} alt={detail.pokemonName} className="w-28 h-28 object-contain hover:scale-110 hover:-translate-y-1 transition-all duration-300 drop-shadow-xl cursor-pointer" />
                      </Link>
                    ) : (
                      <img src={detail.imageUrl ?? ''} alt={detail.pokemonName} className="w-28 h-28 object-contain drop-shadow-xl" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-mono text-2xl font-black tabular-nums tracking-tighter" style={{ color: rankColor ?? 'var(--color-text-tertiary)' }}>
                        #{detail.rank}
                      </span>
                      {detail.nameLower ? (
                        <Link href={`/pokemon/${detail.nameLower}`} className="text-3xl font-bold hover:text-blue-500 transition-colors leading-none tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                          {detail.pokemonName}
                        </Link>
                      ) : (
                        <h1 className="text-3xl font-bold leading-none tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{detail.pokemonName}</h1>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {detail.type1 && <TypeIcon type={detail.type1} size="sm" showLabel />}
                      {detail.type2 && <TypeIcon type={detail.type2} size="sm" showLabel />}
                    </div>
                  </div>
                </div>
              </div>

              {/* All sections */}
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>

                {/* Row 1: Abilities | Moves | Items | Natures */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ borderBottom: '1px solid var(--color-border)' }}>

                  {/* Abilities */}
                  <div className="p-4">
                    <SectionHeader>{t('ranking.section.abilities')}</SectionHeader>
                    <div className="flex flex-col gap-1.5">
                      {detail.abilities.map(a => {
                        const row = (
                          <StatPill
                            rank={a.rank}
                            percentage={a.percentage}
                            nameContent={a.name}
                          />
                        );
                        return a.ability_identifier ? (
                          <Link key={a.rank} href={`/data/abilities/${a.ability_identifier}`} className="block outline-none">
                            {row}
                          </Link>
                        ) : <div key={a.rank}>{row}</div>;
                      })}
                    </div>
                  </div>

                  {/* Moves */}
                  <div className="p-4" style={{ borderLeft: '1px solid var(--color-border)' }}>
                    <SectionHeader>{t('ranking.section.moves')}</SectionHeader>
                    <div className="flex flex-col gap-1.5">
                      {detail.moves.map(m => {
                        const row = (
                          <StatPill
                            rank={m.rank}
                            percentage={m.percentage}
                            iconContent={
                              <>
                                {m.move_type && <TypeIcon type={m.move_type} size="xs" />}
                                {m.move_category && <MoveCategoryIcon category={m.move_category as MoveCategory} size={13} />}
                              </>
                            }
                            nameContent={m.name}
                          />
                        );
                        return m.move_identifier ? (
                          <Link key={m.rank} href={`/data/moves/${m.move_identifier}`} className="block outline-none">
                            {row}
                          </Link>
                        ) : <div key={m.rank}>{row}</div>;
                      })}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-4" style={{ borderLeft: '1px solid var(--color-border)' }}>
                    <SectionHeader>{t('ranking.section.items')}</SectionHeader>
                    <div className="flex justify-center mb-3">
                      <UsagePieChart
                        data={detail.items.map(item => ({ name: item.name, value: parseFloat(item.percentage), icon: item.item_sprite ?? undefined }))}
                        activeIndex={itemActiveIndex}
                        onActiveIndexChange={setItemActiveIndex}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {detail.items.map((item, i) => {
                        const dimmed = itemActiveIndex !== null && itemActiveIndex !== i;
                        const row = (
                          <div
                            className="flex items-center gap-2 py-1 px-1.5 rounded transition-all"
                            style={{ opacity: dimmed ? 0.25 : 1 }}
                            onMouseEnter={() => setItemActiveIndex(i)}
                            onMouseLeave={() => setItemActiveIndex(null)}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            {item.item_sprite
                              ? <img src={item.item_sprite} alt={item.name} width={24} height={24} className="shrink-0 object-contain" style={{ imageRendering: 'pixelated' }} />
                              : <div className="w-6 h-6 rounded shrink-0" style={{ background: 'var(--color-bg-tertiary)' }} />
                            }
                            <span className="text-xs truncate flex-1 min-w-0" style={{ color: 'var(--color-text-primary)' }}>{item.name}</span>
                            <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>{parseFloat(item.percentage).toFixed(1)}%</span>
                          </div>
                        );
                        return item.item_identifier ? (
                          <Link key={item.rank} href={`/data/items/${item.item_identifier}`} className="block outline-none">
                            {row}
                          </Link>
                        ) : <div key={item.rank}>{row}</div>;
                      })}
                    </div>
                  </div>

                  {/* Natures */}
                  <div className="p-4" style={{ borderLeft: '1px solid var(--color-border)' }}>
                    <SectionHeader>{t('ranking.section.natures')}</SectionHeader>
                    <div className="flex justify-center mb-3">
                      <UsagePieChart
                        data={detail.natures.map(n => ({ name: n.name, value: parseFloat(n.percentage) }))}
                        activeIndex={natureActiveIndex}
                        onActiveIndexChange={setNatureActiveIndex}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      {detail.natures.map((n, i) => {
                        const dimmed = natureActiveIndex !== null && natureActiveIndex !== i;
                        return (
                          <div
                            key={n.rank}
                            className="grid items-center h-6 px-1.5 rounded transition-all cursor-default"
                            style={{ gridTemplateColumns: '8px 1fr 36px 36px 40px', gap: '6px', opacity: dimmed ? 0.25 : 1 }}
                            onMouseEnter={() => setNatureActiveIndex(i)}
                            onMouseLeave={() => setNatureActiveIndex(null)}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs truncate min-w-0" style={{ color: 'var(--color-text-primary)' }}>{n.name}</span>
                            <span className="text-[10px] font-medium text-red-500 text-right">{n.increased_stat ? `+${n.increased_stat}` : ''}</span>
                            <span className="text-[10px] font-medium text-blue-500 text-right">{n.decreased_stat ? `-${n.decreased_stat}` : ''}</span>
                            <span className="text-[10px] font-mono text-right" style={{ color: 'var(--color-text-tertiary)' }}>{parseFloat(n.percentage).toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Row 2: EV Spreads | Teammates */}
                <div className="grid grid-cols-1 lg:grid-cols-2">

                  {/* EV Spreads */}
                  <div className="p-4 min-w-0">
                    <SectionHeader>{t('ranking.section.evSpreads')}</SectionHeader>
                    <div
                      className="max-h-[320px] overflow-y-auto ev-scroll rounded-xl border"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }}
                    >
                      <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: '40px' }} />
                          <col />
                          <col />
                          <col />
                          <col />
                          <col />
                          <col />
                          <col style={{ width: '64px' }} />
                        </colgroup>
                        <thead className="sticky top-0 z-10 backdrop-blur-md text-[10px] tracking-wider" style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                          <tr>
                            <th className="py-2 px-1 font-bold text-center">#</th>
                            {(['hp', 'attack', 'defense', 'sp_atk', 'sp_def', 'speed'] as const).map(stat => (
                              <th key={stat} className="py-2 px-1 font-bold text-center">{STAT_LABELS[stat]}</th>
                            ))}
                            <th className="py-2 px-2 font-bold text-right">{t('ranking.section.usage')}</th>
                          </tr>
                        </thead>
                        <tbody className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                          {detail.evSpreads.map(ev => (
                            <tr key={ev.rank} className="transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td className="py-1.5 px-1 text-center font-mono text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{ev.rank}</td>
                              {(['hp', 'attack', 'defense', 'sp_atk', 'sp_def', 'speed'] as const).map(stat => (
                                <td key={stat} className="py-1.5 px-1 text-center tabular-nums" style={{ color: ev[stat] > 0 ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', fontWeight: ev[stat] > 0 ? 600 : 400 }}>
                                  {ev[stat] > 0 ? ev[stat] : '-'}
                                </td>
                              ))}
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-blue-500 dark:text-blue-300 text-[11px]">
                                {parseFloat(ev.percentage).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Teammates */}
                  <div className="p-4" style={{ borderLeft: '1px solid var(--color-border)' }}>
                    <SectionHeader>{t('ranking.section.teammates')}</SectionHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                      {detail.teammates.map(t => {
                        const card = (
                          <div className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all group cursor-pointer border" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                            {t.teammate_image
                              ? <img src={t.teammate_image} alt={t.name} className="w-12 h-12 object-contain group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform drop-shadow-lg" />
                              : <div className="w-12 h-12 rounded-full" style={{ background: 'var(--color-border)' }} />
                            }
                            <span className="text-[11px] font-semibold text-center leading-tight truncate w-full transition-colors" style={{ color: 'var(--color-text-secondary)' }}>{t.name}</span>
                            <div className="flex gap-1 justify-center">
                              {t.teammate_type1 && <TypeIcon type={t.teammate_type1} size="xs" />}
                              {t.teammate_type2 && <TypeIcon type={t.teammate_type2} size="xs" />}
                            </div>
                          </div>
                        );
                        return t.teammate_slug ? (
                          <Link key={t.rank} href={`/ranking/${season}/${format}/${t.teammate_slug}`} className="block outline-none">
                            {card}
                          </Link>
                        ) : <div key={t.rank}>{card}</div>;
                      })}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common'])),
  },
  revalidate: 3600,
});
