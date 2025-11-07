import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { TeamPokemon, PokemonFull, StatSpread } from '@brianchan661/pokemon-champion-shared';
import { pokemonBuilderService } from '@/services/pokemonBuilderService';
import { naturesService, Nature } from '@/services/naturesService';
import { teraTypesService, TeraType } from '@/services/teraTypesService';
import { itemsService, Item } from '@/services/itemsService';
import { getDefaultIVs, getDefaultEVs, validateEVs } from '@/utils/calculateStats';
import { StatCalculator } from './StatCalculator';
import { EVInputs } from './EVInputs';
import { MoveSelector } from './MoveSelector';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { TypeIcon } from '@/components/UI';

interface PokemonConfiguratorProps {
  pokemonNationalNumber: string;
  existingConfig?: Partial<TeamPokemon>;
  onSave: (config: TeamPokemon) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Multi-section Pokemon configuration panel
 * Handles all Pokemon customization options
 */
export function PokemonConfigurator({ pokemonNationalNumber, existingConfig, onSave, onCancel, className = '' }: PokemonConfiguratorProps) {
  const { t } = useTranslation('common');

  // Pokemon data
  const [pokemon, setPokemon] = useState<PokemonFull | null>(null);
  const [abilities, setAbilities] = useState<any[]>([]);
  const [natures, setNatures] = useState<Nature[]>([]);
  const [teraTypes, setTeraTypes] = useState<TeraType[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration state
  const [level, setLevel] = useState(existingConfig?.level || 100);
  const [abilityIdentifier, setAbilityIdentifier] = useState(existingConfig?.abilityIdentifier || '');
  const [moves, setMoves] = useState<number[]>(existingConfig?.moves || []);
  const [natureId, setNatureId] = useState<number>(existingConfig?.natureId || 0);
  const [ivs, setIvs] = useState<StatSpread>(existingConfig?.ivs || getDefaultIVs());
  const [evs, setEvs] = useState<StatSpread>(existingConfig?.evs || getDefaultEVs());
  const [teraType, setTeraType] = useState<string | undefined>(existingConfig?.teraType);
  const [itemId, setItemId] = useState<number | undefined>(existingConfig?.itemId);

  // Extract available move names from Pokemon data
  const [availableMoveNames, setAvailableMoveNames] = useState<string[]>([]);

  // Active tab
  const [activeTab, setActiveTab] = useState<'basic' | 'stats' | 'moves'>('basic');

  // Item selector visibility and search
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const itemSelectorRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Load Pokemon details
      const pokemonResult = await pokemonBuilderService.getPokemonByNationalNumber(pokemonNationalNumber);
      if (pokemonResult.success && pokemonResult.data) {
        setPokemon(pokemonResult.data);

        // Extract available move names from latest generation only
        const moveNames = new Set<string>();
        if (pokemonResult.data.details?.movesByGeneration && pokemonResult.data.details.movesByGeneration.length > 0) {
          // Get the first generation (newest/latest generation)
          const latestGen = pokemonResult.data.details.movesByGeneration[0];

          // Get the latest game version from that generation
          if (latestGen.gameVersions && latestGen.gameVersions.length > 0) {
            const latestVersion = latestGen.gameVersions[0];
            const methods = latestVersion.movesByMethod || {};

            // Extract moves from all learn methods (level-up, TM, egg, etc.)
            Object.values(methods).forEach((moveList: any) => {
              if (Array.isArray(moveList)) {
                moveList.forEach((move: any) => {
                  if (move.name) {
                    moveNames.add(move.name);
                  }
                });
              }
            });
          }
        }
        setAvailableMoveNames(Array.from(moveNames));

        // Load abilities
        const abilitiesResult = await pokemonBuilderService.getPokemonAbilities(pokemonResult.data.id);
        if (abilitiesResult.success && abilitiesResult.data) {
          setAbilities(abilitiesResult.data);
          if (!abilityIdentifier && abilitiesResult.data.length > 0) {
            setAbilityIdentifier(abilitiesResult.data[0].identifier);
          }
        }
      }

      // Load natures
      const naturesResult = await naturesService.getNatures();
      if (naturesResult.success && naturesResult.data) {
        setNatures(naturesResult.data);
        if (!natureId && naturesResult.data.length > 0) {
          setNatureId(naturesResult.data[0].id);
        }
      }

      // Load Tera Types
      const teraResult = await teraTypesService.getTeraTypes();
      if (teraResult.success && teraResult.data) {
        setTeraTypes(teraResult.data);
      }

      // Load Items (all competitive items)
      const itemsResult = await itemsService.getItems();
      if (itemsResult.success && itemsResult.data) {
        setItems(itemsResult.data);
      }

      setLoading(false);
    }

    loadData();
  }, [pokemonNationalNumber]);

  // Close item selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (itemSelectorRef.current && !itemSelectorRef.current.contains(event.target as Node)) {
        setShowItemSelector(false);
        setItemSearchQuery(''); // Clear search when closing
      }
    }

    if (showItemSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showItemSelector]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!itemSearchQuery.trim()) {
      return items;
    }
    const query = itemSearchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.identifier?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  }, [items, itemSearchQuery]);

  // Handle save
  const handleSave = () => {
    if (!pokemon) return;

    const validation = validateEVs(evs);
    if (!validation.valid) {
      alert(t('teamBuilder.evValidationError', 'Please fix EV errors before saving'));
      return;
    }

    if (moves.length === 0) {
      alert(t('teamBuilder.movesRequired', 'Please select at least one move'));
      return;
    }

    const config: TeamPokemon = {
      pokemonId: pokemon.id,
      level,
      abilityIdentifier,
      moves,
      natureId,
      evs,
      ivs,
      teraType,
      itemId,
    };

    onSave(config);
  };

  if (loading || !pokemon) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedNature = natures.find((n) => n.id === natureId) || null;

  // Get base stats from pokemon details
  const baseStats: StatSpread = {
    hp: pokemon.details?.hpBase || 0,
    attack: pokemon.details?.attackBase || 0,
    defense: pokemon.details?.defenseBase || 0,
    spAtk: pokemon.details?.spAtkBase || 0,
    spDef: pokemon.details?.spDefBase || 0,
    speed: pokemon.details?.speedBase || 0,
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {pokemon.imageUrl && (
            <img src={pokemon.imageUrl} alt={pokemon.name} className="w-20 h-20 object-contain" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {pokemon.name}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">#{pokemon.nationalNumber}</p>
              <div className="flex gap-1">
                {pokemon.types.map((type) => (
                  <TypeIcon key={type} type={type} size="xs" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'basic', label: t('teamBuilder.basic', 'Basic') },
            { id: 'stats', label: t('teamBuilder.stats', 'Stats') },
            { id: 'moves', label: t('teamBuilder.moves', 'Moves') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('teamBuilder.level', 'Level')} ({level})
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Ability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('teamBuilder.ability', 'Ability')}
              </label>
              <select
                value={abilityIdentifier}
                onChange={(e) => setAbilityIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {abilities.map((ability) => (
                  <option key={ability.identifier} value={ability.identifier}>
                    {ability.name} {ability.isHidden && '(Hidden)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Tera Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('teamBuilder.teraType', 'Tera Type')}
              </label>
              <select
                value={teraType || ''}
                onChange={(e) => setTeraType(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{t('teamBuilder.none', 'None')}</option>
                {teraTypes.map((type) => (
                  <option key={type.id} value={type.typeName}>
                    {type.typeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Held Item */}
            <div className="relative" ref={itemSelectorRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('teamBuilder.heldItem', 'Held Item')}
              </label>
              <button
                type="button"
                onClick={() => setShowItemSelector(!showItemSelector)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {itemId && items.find(i => i.id === itemId)?.spriteUrl && (
                    <img
                      src={items.find(i => i.id === itemId)?.spriteUrl}
                      alt={items.find(i => i.id === itemId)?.name}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span>{itemId ? items.find(i => i.id === itemId)?.name : t('teamBuilder.none', 'None')}</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showItemSelector && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                    <input
                      type="text"
                      placeholder={t('teamBuilder.searchItems', 'Search items...')}
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Items List */}
                  <div className="overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setItemId(undefined);
                        setShowItemSelector(false);
                        setItemSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 border-b border-gray-100"
                    >
                      <span className="text-gray-500">{t('teamBuilder.none', 'None')}</span>
                    </button>
                    {filteredItems.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        {t('teamBuilder.noItemsFound', 'No items found')}
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setItemId(item.id);
                            setShowItemSelector(false);
                            setItemSearchQuery('');
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                            itemId === item.id ? 'bg-primary-50' : ''
                          }`}
                        >
                          {item.spriteUrl && (
                            <img
                              src={item.spriteUrl}
                              alt={item.name}
                              className="w-6 h-6 object-contain flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block">{item.name}</span>
                            {item.category && (
                              <span className="text-xs text-gray-500">{item.category}</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Nature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('teamBuilder.nature', 'Nature')}
              </label>
              <select
                value={natureId}
                onChange={(e) => setNatureId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {natures.map((nature) => (
                  <option key={nature.id} value={nature.id}>
                    {nature.name}
                    {nature.increasedStat && nature.decreasedStat &&
                      ` (+${nature.increasedStat}, -${nature.decreasedStat})`}
                  </option>
                ))}
              </select>
            </div>

            {/* EVs */}
            <EVInputs evs={evs} onChange={setEvs} />

            {/* IVs (Collapsible) */}
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                {t('teamBuilder.ivs', 'IVs')} (Advanced)
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {(Object.keys(ivs) as Array<keyof StatSpread>).map((stat) => (
                  <div key={stat}>
                    <label className="block text-sm text-gray-600 mb-1">
                      {stat.toUpperCase()}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={ivs[stat]}
                      onChange={(e) => setIvs({ ...ivs, [stat]: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </details>

            {/* Stat Calculator */}
            <StatCalculator
              baseStats={baseStats}
              ivs={ivs}
              evs={evs}
              level={level}
              nature={selectedNature}
            />
          </div>
        )}

        {activeTab === 'moves' && (
          <div>
            <MoveSelector
              selectedMoveIds={moves}
              onMoveSelect={(moveId) => setMoves([...moves, moveId])}
              onMoveRemove={(moveId) => setMoves(moves.filter((id) => id !== moveId))}
              availableMoveNames={availableMoveNames}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t('common.save', 'Save')}
        </button>
      </div>
    </div>
  );
}
