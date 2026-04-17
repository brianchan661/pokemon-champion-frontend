import Link from 'next/link';
import { memo } from 'react';
import { Team } from '@brianchan661/pokemon-champion-shared';
import { useTranslation } from 'next-i18next';
import { TypeIcon } from '@/components/UI/TypeIcon';
import { getTypeHex } from '@/utils/typeColors';
import { getLocalizedMoveName } from '@/utils/localizedName';

interface TeamCardProps {
  team: Team;
  showAuthor?: boolean;
  className?: string;
  index?: number;
  layout?: 'grid' | 'list';
}

export const TeamCard = memo(({ team, showAuthor = true, className = '', index = 0, layout = 'grid' }: TeamCardProps) => {
  const { t, i18n } = useTranslation('common');

  // Derive dominant type from first pokemon
  const firstType = team.pokemon[0]?.pokemonData?.types?.[0] || 'normal';
  const accentColor = getTypeHex(firstType);

  // Collect all unique types from the team
  const allTypes = Array.from(new Set(
    team.pokemon.flatMap(p => p.pokemonData?.types || [])
  )).slice(0, 6);

  return (
    <Link
      href={`/teams/${team.id}`}
      className={`group block relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5 ${className}`}
      style={{
        background: `linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)`,
        border: `1px solid ${accentColor}33`,
        boxShadow: `0 2px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Accent glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1px ${accentColor}66, 0 4px 32px ${accentColor}22` }}
      />

      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${accentColor} 30%, ${accentColor} 70%, transparent 100%)` }}
      />

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Left: title + meta */}
          <div className="min-w-0">
            <h2
              className="text-xl font-bold text-dark-text-primary truncate leading-tight mb-1"
              style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.02em' }}
            >
              {team.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type coverage chips */}
              <div className="flex items-center gap-0.5">
                {allTypes.map(type => (
                  <TypeIcon key={type} type={type} size="xs" />
                ))}
              </div>
              {/* Likes */}
              {team.likes > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                  {team.likes}
                </span>
              )}
            </div>
          </div>

          {/* Right: author + date */}
          {showAuthor && (
            <div className="shrink-0 flex items-center gap-2">
              <div className="text-right">
                <p className="text-[11px] font-semibold text-dark-text-secondary leading-none">
                  {team.authorUsername || 'Unknown'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {new Date(team.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              {team.authorAvatarUrl ? (
                <img
                  src={team.authorAvatarUrl}
                  alt={team.authorUsername || ''}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  style={{ border: `1.5px solid ${accentColor}66` }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `${accentColor}44`, border: `1.5px solid ${accentColor}66` }}
                >
                  {(team.authorUsername || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile: 2x3 grid */}
        <div className="grid grid-cols-3 gap-2 md:hidden">
          {Array.from({ length: 6 }).map((_, i) => {
            const p = team.pokemon[i];
            if (!p) return <div key={i} />;
            const pType = p.pokemonData?.types?.[0] || 'normal';
            const pColor = getTypeHex(pType);
            return (
              <div key={i} className="relative rounded-xl overflow-hidden flex flex-col items-center pb-1.5 pt-1"
                style={{ background: `linear-gradient(180deg, ${pColor}22 0%, transparent 100%)`, border: `1px solid ${pColor}33` }}>
                <div className="relative">
                  {p.pokemonData?.imageUrl ? (
                    <img src={p.pokemonData.imageUrl} alt={p.pokemonData.name || ''} className="w-14 h-14 object-contain"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center text-gray-600 text-xs">?</div>
                  )}
                  {p.teraType && (
                    <div className="absolute top-0 left-0 w-4 h-4 rotate-45 flex items-center justify-center rounded-sm"
                      style={{ background: `${getTypeHex(p.teraType)}cc`, border: `1px solid ${getTypeHex(p.teraType)}` }}
                      title={`Tera: ${p.teraType}`}>
                      <div className="-rotate-45"><TypeIcon type={p.teraType} size="xs" /></div>
                    </div>
                  )}
                  {p.itemData?.spriteUrl && (
                    <img src={p.itemData.spriteUrl} alt="" title={p.itemData.name}
                      className="absolute bottom-0 right-0 w-4 h-4 object-contain"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }} />
                  )}
                </div>
                <p className="text-[10px] font-bold text-dark-text-secondary truncate w-full text-center px-1 leading-tight">
                  {p.pokemonData?.name ?? '???'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Desktop grid layout: 2-col compact roster */}
        {layout === 'grid' && (
          <div className="hidden md:grid grid-cols-2 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => {
              const p = team.pokemon[i];
              if (!p) return <div key={i} className="h-10" />;
              const pType = p.pokemonData?.types?.[0] || 'normal';
              const pColor = getTypeHex(pType);
              return (
                <div key={i} className="relative rounded-xl overflow-hidden flex flex-row items-stretch"
                  style={{ background: `linear-gradient(135deg, ${pColor}1a 0%, transparent 70%)`, border: `1px solid ${pColor}2e` }}>
                  {/* Sprite */}
                  <div className="relative shrink-0 flex items-center justify-center w-12" style={{ background: `${pColor}18` }}>
                    {p.pokemonData?.imageUrl ? (
                      <img src={p.pokemonData.imageUrl} alt={p.pokemonData.name || ''} className="w-10 h-10 object-contain"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center text-gray-600 text-xs">?</div>
                    )}
                    {p.teraType && (
                      <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rotate-45 flex items-center justify-center rounded-sm"
                        style={{ background: `${getTypeHex(p.teraType)}cc`, border: `1px solid ${getTypeHex(p.teraType)}` }}
                        title={`Tera: ${p.teraType}`}>
                        <div className="-rotate-45"><TypeIcon type={p.teraType} size="xs" /></div>
                      </div>
                    )}
                    {p.itemData?.spriteUrl && (
                      <img src={p.itemData.spriteUrl} alt="" title={p.itemData.name}
                        className="absolute bottom-0 right-0 w-4 h-4 object-contain"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }} />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1 pr-1.5 pl-1.5 gap-0.5">
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <p className="text-[11px] font-extrabold text-dark-text-primary truncate leading-none"
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {p.pokemonData?.name ?? '???'}
                      </p>
                      {p.abilityData?.name && (
                        <p className="text-[8px] font-semibold truncate leading-none shrink-0 max-w-[50%]" style={{ color: `${pColor}dd` }}>
                          {p.abilityData.name}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-0.5">
                      {(p.movesData || []).slice(0, 4).map((move, mi) => {
                        const mColor = move.type ? getTypeHex(move.type) : '#6b7280';
                        return (
                          <div key={mi} className="flex items-center gap-0.5 truncate text-[7.5px] font-semibold px-1 py-px rounded leading-tight"
                            style={{ background: `${mColor}25`, color: mColor, border: `1px solid ${mColor}35` }}>
                            {move.type && <TypeIcon type={move.type} size="xs" />}
                            <span className="truncate">{getLocalizedMoveName(move, i18n.language)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Desktop list layout: 6 pokemon columns side by side, more info per slot */}
        {layout === 'list' && (
          <div className="hidden md:flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => {
              const p = team.pokemon[i];
              if (!p) return <div key={i} className="flex-1 invisible" style={{ minWidth: 0 }} />;
              const pType = p.pokemonData?.types?.[0] || 'normal';
              const pColor = getTypeHex(pType);
              return (
                <div key={i} className="flex-1 min-w-0 rounded-xl overflow-hidden flex flex-col"
                  style={{ background: `linear-gradient(180deg, ${pColor}22 0%, var(--color-bg-tertiary) 100%)`, border: `1px solid ${pColor}44` }}>
                  {/* Sprite area */}
                  <div className="relative flex justify-center pt-2 pb-1" style={{ background: `${pColor}15` }}>
                    {p.pokemonData?.imageUrl ? (
                      <img src={p.pokemonData.imageUrl} alt={p.pokemonData.name || ''} className="w-16 h-16 object-contain"
                        style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }} />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center text-gray-600">?</div>
                    )}
                    {p.teraType && (
                      <div className="absolute top-1 left-1 w-5 h-5 rotate-45 flex items-center justify-center rounded-sm"
                        style={{ background: `${getTypeHex(p.teraType)}cc`, border: `1px solid ${getTypeHex(p.teraType)}` }}
                        title={`Tera: ${p.teraType}`}>
                        <div className="-rotate-45"><TypeIcon type={p.teraType} size="xs" /></div>
                      </div>
                    )}
                    {p.itemData?.spriteUrl && (
                      <img src={p.itemData.spriteUrl} alt="" title={p.itemData.name}
                        className="absolute bottom-1 right-1 w-8 h-8 object-contain"
                        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1 px-1.5 py-1.5 flex-1">
                    {/* Name */}
                    <p className="text-[12px] font-extrabold text-dark-text-primary truncate leading-none text-center"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {p.pokemonData?.name ?? '???'}
                    </p>

                    {/* Types left, ability + nature right */}
                    <div className="flex items-start justify-between gap-1 min-w-0">
                      <div className="flex gap-0.5 flex-wrap shrink-0">
                        {(p.pokemonData?.types || []).map(type => (
                          <TypeIcon key={type} type={type} size="xs" />
                        ))}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 min-w-0">
                        {p.abilityData?.name && (
                          <p className="text-[9px] font-semibold truncate leading-none text-right"
                            style={{ color: `${pColor}cc` }}>
                            {p.abilityData.name}
                          </p>
                        )}
                        {p.natureData?.name && (
                          <p className="text-[9px] text-dark-text-secondary truncate leading-none text-right">
                            {p.natureData.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Moves */}
                    <div className="flex flex-col gap-0.5">
                      {(p.movesData || []).slice(0, 4).map((move, mi) => {
                        const mColor = move.type ? getTypeHex(move.type) : '#6b7280';
                        return (
                          <div key={mi} className="flex items-center gap-0.5 truncate text-[8.5px] font-semibold px-1 py-0.5 rounded leading-tight"
                            style={{ background: `${mColor}22`, color: mColor, border: `1px solid ${mColor}33` }}>
                            {move.type && <TypeIcon type={move.type} size="xs" />}
                            <span className="truncate">{getLocalizedMoveName(move, i18n.language)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View arrow */}
        <div
          className="absolute bottom-4 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 flex items-center gap-1 text-xs font-semibold"
          style={{ color: accentColor }}
        >
          {t('teams.viewDetails')}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
});

TeamCard.displayName = 'TeamCard';
