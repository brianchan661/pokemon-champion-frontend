import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Pokemon, ApiResponse } from 'pokemon-champion-shared';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function PokemonListPage() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'national_number' | 'stat_total' | 'hp_max' | 'attack_max' | 'defense_max' | 'sp_atk_max' | 'sp_def_max' | 'speed_max'>('national_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const typeFilterRef = useRef<HTMLDivElement>(null);

  const handleSort = (column: 'name' | 'national_number' | 'stat_total' | 'hp_max' | 'attack_max' | 'defense_max' | 'sp_atk_max' | 'sp_def_max' | 'speed_max') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['pokemon', typeFilter, sortBy, sortOrder, locale],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      params.append('sortBy', sortBy);
      params.append('order', sortOrder);
      params.append('lang', locale || 'en');

      const response = await axios.get<ApiResponse<Pokemon[]>>(
        `${API_URL}/pokemon?${params.toString()}`
      );
      return response.data.data || [];
    },
  });

  const pokemon = data || [];
  const allTypes = Array.from(
    new Set(pokemon.flatMap((p) => p.types))
  ).sort();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setShowTypeFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('pokemon.title')}</h1>


        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">{t('pokemon.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {t('pokemon.error')}
          </div>
        )}

        {/* Pokemon Table - Desktop */}
        {!isLoading && !error && pokemon.length > 0 && (
          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('national_number')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      {t('pokemon.number')}
                      <SortIcon column="national_number" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ width: '100px' }}>
                    {t('pokemon.image')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {t('pokemon.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap relative">
                    <button
                      onClick={() => setShowTypeFilter(!showTypeFilter)}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      {t('pokemon.type')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showTypeFilter && (
                      <div
                        ref={typeFilterRef}
                        className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-[200px]"
                      >
                        <div className="text-sm font-semibold text-gray-700 mb-2">{t('pokemon.filterByType')}</div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="radio"
                              name="typeFilter"
                              value=""
                              checked={typeFilter === ''}
                              onChange={() => setTypeFilter('')}
                              className="cursor-pointer"
                            />
                            <span className="text-sm">{t('pokemon.allTypes')}</span>
                          </label>
                          {allTypes.map((type) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                type="radio"
                                name="typeFilter"
                                value={type}
                                checked={typeFilter === type}
                                onChange={() => setTypeFilter(type)}
                                className="cursor-pointer"
                              />
                              <TypeIcon type={type} size="sm" showLabel={true} />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('stat_total')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto whitespace-nowrap"
                    >
                      {t('pokemon.stats.total')}
                      <SortIcon column="stat_total" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('hp_max')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto whitespace-nowrap"
                    >
                      HP
                      <SortIcon column="hp_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('attack_max')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto whitespace-nowrap"
                    >
                      Atk
                      <SortIcon column="attack_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('defense_max')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto whitespace-nowrap"
                    >
                      Def
                      <SortIcon column="defense_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('sp_atk_max')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto whitespace-nowrap"
                    >
                      SpA
                      <SortIcon column="sp_atk_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('sp_def_max')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto whitespace-nowrap"
                    >
                      SpD
                      <SortIcon column="sp_def_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('speed_max')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto whitespace-nowrap"
                    >
                      Spe
                      <SortIcon column="speed_max" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {t('pokemon.ability1')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {t('pokemon.ability2')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {t('pokemon.abilityHidden')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pokemon.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.open(`/pokemon/${p.nationalNumber}`, '_blank')}
                  >
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-500">
                      {p.nationalNumber}
                    </td>
                    <td className="px-2 py-1">
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="object-contain mx-auto"
                          style={{ width: '80px', height: '80px' }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap text-sm font-medium text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap">
                      <div className="flex gap-1">
                        {p.types.map((type, idx) => (
                          <TypeIcon key={idx} type={type} size="sm" />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                      {p.statTotal}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600">
                      {p.hpMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600">
                      {p.attackMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600">
                      {p.defenseMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600">
                      {p.spAtkMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600">
                      {p.spDefMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600">
                      {p.speedMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-600">
                      <Link
                        href={`/data/abilities/${p.ability1.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-primary-600 hover:text-primary-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.ability1}
                      </Link>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-600">
                      {p.ability2 ? (
                        <Link
                          href={`/data/abilities/${p.ability2.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-primary-600 hover:text-primary-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.ability2}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-600">
                      {p.abilityHidden ? (
                        <Link
                          href={`/data/abilities/${p.abilityHidden.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-primary-600 hover:text-primary-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.abilityHidden}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pokemon Cards - Mobile */}
        {!isLoading && !error && pokemon.length > 0 && (
          <div className="md:hidden space-y-4">
            {pokemon.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg"
                onClick={() => window.open(`/pokemon/${p.nationalNumber}`, '_blank')}
              >
                <div className="flex items-start gap-4">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-40 w-40 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">#{p.nationalNumber}</span>
                      <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {p.types.map((type, idx) => (
                        <TypeIcon key={idx} type={type} size="sm" />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-semibold">Total: {p.statTotal}</p>
                      <p>
                        HP {p.hpMax} / Atk {p.attackMax} / Def {p.defenseMax}
                      </p>
                      <p>
                        SpA {p.spAtkMax} / SpD {p.spDefMax} / Spe {p.speedMax}
                      </p>
                      <div className="mt-2">
                        <p className="font-semibold text-gray-700 mb-1">Abilities:</p>
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 text-xs">Ability 1: </span>
                            <Link
                              href={`/data/abilities/${p.ability1.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-primary-600 hover:text-primary-700 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {p.ability1}
                            </Link>
                          </div>
                          {p.ability2 && (
                            <div>
                              <span className="text-gray-500 text-xs">Ability 2: </span>
                              <Link
                                href={`/data/abilities/${p.ability2.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-primary-600 hover:text-primary-700 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {p.ability2}
                              </Link>
                            </div>
                          )}
                          {p.abilityHidden && (
                            <div>
                              <span className="text-gray-500 text-xs">Hidden: </span>
                              <Link
                                href={`/data/abilities/${p.abilityHidden.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-primary-600 hover:text-primary-700 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {p.abilityHidden}
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && pokemon.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">{t('pokemon.noResults')}</p>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
