import Link from 'next/link';
import { useState } from 'react';
import { Team } from '@brianchan661/pokemon-champion-shared';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';
import { TypeIcon } from '@/components/UI/TypeIcon';

const API_URL = getApiBaseUrl();

interface MyTeamCardProps {
  team: Team;
  onUpdate: () => void;
  className?: string;
}

/**
 * Team card for user's own teams with edit/delete/visibility controls.
 * Shows Pokemon sprites, types, ability, nature, and item for each slot.
 */
export const MyTeamCard = ({ team, onUpdate, className = '' }: MyTeamCardProps) => {
  const { t } = useTranslation('common');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/teams/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('Failed to delete team. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleVisibility = async () => {
    setIsTogglingVisibility(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_URL}/teams/${team.id}`,
        { isPublic: !team.isPublic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      alert('Failed to update team visibility. Please try again.');
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-shadow duration-200 ${className}`}
      style={{
        background: 'linear-gradient(160deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                team.isPublic
                  ? 'text-green-400'
                  : 'text-gray-400'
              }`}
              style={{
                background: team.isPublic ? 'rgba(34,197,94,0.12)' : 'rgba(156,163,175,0.1)',
                border: team.isPublic ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(156,163,175,0.15)',
              }}
            >
              {team.isPublic ? t('teams.public') : t('teams.private')}
            </span>
            {team.isPublic && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {team.likes}
              </span>
            )}
          </div>
          <h2
            className="text-xl font-bold text-dark-text-primary truncate"
            style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.01em' }}
          >
            {team.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(team.createdAt).toLocaleDateString()} · {team.pokemon.length} Pokémon
          </p>
        </div>
      </div>

      {/* Pokemon roster */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const p = team.pokemon[i];
            if (!p) {
              return (
                <div
                  key={i}
                  className="rounded-xl flex items-center justify-center h-20"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px dashed var(--color-border)' }}
                >
                  <span className="text-gray-700 text-xl font-bold">+</span>
                </div>
              );
            }
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden relative"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
              >
                {/* Sprite */}
                <div className="flex items-center justify-center pt-1">
                  {p.pokemonData?.imageUrl ? (
                    <img
                      src={p.pokemonData.imageUrl}
                      alt={p.pokemonData.name}
                      className="w-14 h-14 object-contain"
                      title={p.pokemonData.name}
                    />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center text-gray-600 text-xs font-bold">?</div>
                  )}
                </div>
                {/* Name + types */}
                <div className="px-1.5 pb-2">
                  <p className="text-[11px] font-bold text-dark-text-primary truncate text-center leading-tight mb-1">
                    {p.pokemonData?.name ?? '???'}
                  </p>
                  <div className="flex justify-center gap-0.5 flex-wrap">
                    {p.pokemonData?.types?.map((type) => (
                      <TypeIcon key={type} type={type} size="xs" />
                    ))}
                  </div>
                  {/* Ability */}
                  {p.abilityData?.name && (
                    <p className="text-[9px] text-gray-500 truncate text-center mt-1 leading-tight">
                      {p.abilityData.name}
                    </p>
                  )}
                  {/* Item */}
                  {p.itemData?.name && (
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      {p.itemData.spriteUrl && (
                        <img src={p.itemData.spriteUrl} alt="" className="w-3 h-3 object-contain" />
                      )}
                      <p className="text-[9px] text-gray-600 truncate leading-tight">{p.itemData.name}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ height: '1px', background: 'var(--color-border)' }} />

      {/* Action bar */}
      <div className="px-5 py-3 flex items-center gap-2">
        <Link
          href={`/teams/${team.id}`}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-center transition-all"
          style={{
            background: 'rgba(37,99,235,0.2)',
            color: '#60a5fa',
            border: '1px solid rgba(37,99,235,0.35)',
          }}
        >
          {t('teams.viewDetails')}
        </Link>
        <Link
          href={`/teams/${team.id}/edit`}
          className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {t('teams.edit')}
        </Link>
        {/* Visibility toggle */}
        <button
          onClick={handleToggleVisibility}
          disabled={isTogglingVisibility}
          title={team.isPublic ? t('teams.makePrivate') : t('teams.makePublic')}
          className="p-2 rounded-xl transition-all disabled:opacity-50"
          style={{
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {isTogglingVisibility ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : team.isPublic ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          onBlur={() => setShowDeleteConfirm(false)}
          title={showDeleteConfirm ? t('teams.confirmDelete') : t('teams.delete')}
          className="px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={showDeleteConfirm
            ? { background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }
            : { background: 'var(--color-bg-tertiary)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
          }
        >
          {isDeleting ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : showDeleteConfirm ? (
            t('teams.confirmDelete')
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
