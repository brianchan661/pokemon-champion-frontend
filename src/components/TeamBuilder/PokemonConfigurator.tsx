import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { TeamPokemon, StatSpread, Pokemon } from '@brianchan661/pokemon-champion-shared';
import { pokemonBuilderService, ChampionsPokemonDetail } from '@/services/pokemonBuilderService';
import { naturesService, Nature } from '@/services/naturesService';
import { teraTypesService, TeraType } from '@/services/teraTypesService';
import { TeraTypeIcon } from '@/components/UI/TeraTypeIcon';
import { itemsService, Item } from '@/services/itemsService';
import { ItemPickerModal } from './ItemPickerModal';
import { getDefaultEVs, validateEVs } from '@/utils/calculateStats';
import { getLocalizedMoveName } from '@/utils/localizedName';
import { MEGA_FORM_TO_STONE } from '@brianchan661/pokemon-champion-shared';
import { EVInputs } from './EVInputs';
import { MovePicker } from './MovePicker';
import { NaturePickerModal } from './NaturePickerModal';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { TypeIcon } from '@/components/UI';

function FormPickerModal({ basePokemon, forms, currentSlug, onSelect, onClose, t }: {
  basePokemon: Pokemon;
  forms: Pokemon[];
  currentSlug?: string;
  onSelect: (slug: string | undefined) => void;
  onClose: () => void;
  t: (key: string, fallback: string) => string;
}) {
  // The API already includes the base form inside `forms` when viewing an alternate form,
  // so deduplicate by id before prepending the explicit base entry.
  const allOptions: { pokemon: Pokemon; slug: string | undefined }[] = [
    { pokemon: basePokemon, slug: undefined },
    ...forms.filter((f) => f.id !== basePokemon.id).map((f) => ({ pokemon: f, slug: f.nameLower })),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border w-full max-w-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary">
          <span className="text-sm font-bold text-gray-800 dark:text-dark-text-primary">{t('battleReference.changeForm', 'Change Form')}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
          {allOptions.map(({ pokemon, slug }) => {
            const isSelected = slug === currentSlug;
            return (
              <button
                key={slug ?? '__base__'}
                onClick={() => onSelect(slug)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }`}
              >
                {pokemon.imageUrl && (
                  <img src={pokemon.imageUrl} alt={pokemon.name} className="w-10 h-10 object-contain shrink-0" />
                )}
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">{pokemon.name}</p>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {pokemon.types.map((ty) => <TypeIcon key={ty} type={ty} size="xs" />)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface PokemonConfiguratorProps {
  pokemonNameLower: string;
  existingConfig?: Partial<TeamPokemon>;
  onSave: (config: TeamPokemon) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Multi-section Pokemon configuration panel
 * Handles all Pokemon customization options
 */
export function PokemonConfigurator({ pokemonNameLower, existingConfig, onSave, onCancel, className = '' }: PokemonConfiguratorProps) {
  const { t, i18n } = useTranslation('common');

  // Pokemon data
  const [pokemon, setPokemon] = useState<ChampionsPokemonDetail | null>(null);
  const [basePokemonData, setBasePokemonData] = useState<ChampionsPokemonDetail['base'] | null>(null);
  const [baseAbilityIdentifier, setBaseAbilityIdentifier] = useState<string>('');
  const [baseAbilities, setBaseAbilities] = useState<any[]>([]);
  const [abilities, setAbilities] = useState<any[]>([]);
  const [natures, setNatures] = useState<Nature[]>([]);
  const [teraTypes, setTeraTypes] = useState<TeraType[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Configuration state
  const [abilityIdentifier, setAbilityIdentifier] = useState(existingConfig?.abilityIdentifier || '');
  const [moves, setMoves] = useState<number[]>(existingConfig?.moves || []);
  const [selectedMovesData, setSelectedMovesData] = useState<any[]>(existingConfig?.movesData || []);
  const [natureId, setNatureId] = useState<number>(existingConfig?.natureId || 0);
  const [evs, setEvs] = useState<StatSpread>(existingConfig?.evs || getDefaultEVs());
  const [teraType, setTeraType] = useState<string | undefined>(existingConfig?.teraType);

  const [itemId, setItemId] = useState<number | undefined>(existingConfig?.itemId);
  const [selectedFormSlug, setSelectedFormSlug] = useState<string | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Ability description tooltip
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);

  // Nature picker visibility
  const [showNaturePicker, setShowNaturePicker] = useState(false);

  // Form picker visibility
  const [showFormPicker, setShowFormPicker] = useState(false);

  // Move picker visibility
  const [showMovePicker, setShowMovePicker] = useState(false);

  // Item picker visibility
  const [showItemPicker, setShowItemPicker] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      // Don't set loading true if we are just switching languages and have data? 
      // Actually yes, we want to show loading because names will change.
      setLoading(true);

      const currentLang = (i18n.language.startsWith('ja') ? 'ja' : 'en') as 'en' | 'ja';

      // Load base Pokemon details (always use base slug to get the full forms list)
      const pokemonResult = await pokemonBuilderService.getPokemonBySlug(pokemonNameLower, currentLang);
      if (!pokemonResult.success || !pokemonResult.data) {
        setError(`Failed to load Pokemon data for "${pokemonNameLower}"`);
        setLoading(false);
        return;
      }

      const detailToUse = pokemonResult.data;

      setPokemon(detailToUse);
      setBasePokemonData(detailToUse.base);
      const mappedAbilities = (detailToUse.abilities ?? []).map(a => ({
        identifier: a.identifier,
        name: currentLang === 'ja' ? (a.nameJa || a.nameEn) : a.nameEn,
        description: currentLang === 'ja' ? (a.descriptionJa || a.descriptionEn) : a.descriptionEn,
      }));
      setAbilities(mappedAbilities);
      setBaseAbilities(mappedAbilities);
      const initialAbility = existingConfig?.abilityIdentifier || mappedAbilities[0]?.identifier || '';
      setAbilityIdentifier((prev) => prev || initialAbility);
      setBaseAbilityIdentifier(initialAbility);

      // Load natures
      const naturesResult = await naturesService.getNatures(currentLang);
      if (naturesResult.success && naturesResult.data) {
        setNatures(naturesResult.data);
        setNatureId((prev) => prev || naturesResult.data![0]?.id || 0);
      }

      // Load Tera Types
      const teraResult = await teraTypesService.getTeraTypes();
      if (teraResult.success && teraResult.data) {
        setTeraTypes(teraResult.data);
      }

      // Restore pre-selected item when re-editing a slot (use identifier slug, not numeric ID)
      if (existingConfig?.itemData?.identifier) {
        itemsService.getItemByIdentifier(existingConfig.itemData.identifier, currentLang).then((res) => {
          if (res.success && res.data) setSelectedItem(res.data);
        });
      }

      setLoading(false);
    }

    loadData();
  }, [pokemonNameLower, i18n.language]);

  // Handle form change (mega/alternate form switch)
  const handleFormChange = async (slug: string | undefined) => {
    if (!pokemon) return;
    const savedForms = pokemon.forms;
    const targetSlug = slug ?? pokemonNameLower;
    setFormLoading(true);
    const currentLang = (i18n.language.startsWith('ja') ? 'ja' : 'en') as 'en' | 'ja';
    const result = await pokemonBuilderService.getPokemonBySlug(targetSlug, currentLang);
    if (result.success && result.data) {
      // Keep the forms list from before so the picker always shows all options
      setPokemon({ ...result.data, forms: savedForms });
      const mappedAbilities = (result.data.abilities ?? []).map(a => ({
        identifier: a.identifier,
        name: currentLang === 'ja' ? (a.nameJa || a.nameEn) : a.nameEn,
        description: currentLang === 'ja' ? (a.descriptionJa || a.descriptionEn) : a.descriptionEn,
      }));
      setAbilities(mappedAbilities);
      setAbilityIdentifier(mappedAbilities[0]?.identifier || '');
      setMoves([]);
      setSelectedMovesData([]);
    }

    // Auto-select mega stone when switching to a mega form
    if (slug) {
      // Snapshot the current base ability before overwriting abilities with mega's single ability
      setBaseAbilityIdentifier(abilityIdentifier);
      const stoneIdentifier = MEGA_FORM_TO_STONE[slug];
      if (stoneIdentifier) {
        const res = await itemsService.getItemByIdentifier(stoneIdentifier, currentLang);
        if (res.success && res.data) {
          setItemId(res.data.id);
          setSelectedItem(res.data);
        }
      }
    } else {
      // Switching back to base — clear item if it was a mega stone
      if (selectedItem?.category === 'mega-stone') {
        setItemId(undefined);
        setSelectedItem(undefined);
      }
    }

    setSelectedFormSlug(slug);
    setFormLoading(false);
  };

  // Handle save
  const handleSave = () => {
    if (!pokemon) return;
    setError('');

    const validation = validateEVs(evs);
    if (!validation.valid) {
      setError(t('teamBuilder.evValidationError', 'Please fix EV errors before saving'));
      return;
    }

    if (moves.length === 0) {
      setError(t('teamBuilder.movesRequired', 'Please select at least one move'));
      return;
    }

    // Always save base form data regardless of which form is currently previewed
    const savedAbilityIdentifier = selectedFormSlug && MEGA_FORM_TO_STONE[selectedFormSlug]
      ? baseAbilityIdentifier
      : abilityIdentifier;
    const selectedAbility = baseAbilities.find(a => a.identifier === savedAbilityIdentifier)
      ?? abilities.find(a => a.identifier === savedAbilityIdentifier);
    const selectedNature = natures.find(n => n.id === natureId);

    const activePokemon = basePokemonData ?? pokemon.base;
    const config: TeamPokemon = {
      pokemonId: activePokemon.id,
      abilityIdentifier: savedAbilityIdentifier,
      moves,
      natureId,
      evs,
      teraType,
      itemId,
      pokemonData: {
        id: activePokemon.id,
        nationalNumber: activePokemon.nationalNumber ?? 0,
        name: activePokemon.name,
        nameLower: activePokemon.nameLower,
        types: activePokemon.types,
        imageUrl: activePokemon.imageUrl,
        baseStats: activePokemon.hpBase != null ? {
          hp: activePokemon.hpBase,
          attack: activePokemon.attackBase!,
          defense: activePokemon.defenseBase!,
          specialAttack: activePokemon.spAtkBase!,
          specialDefense: activePokemon.spDefBase!,
          speed: activePokemon.speedBase!,
        } : undefined,
      },
      abilityData: selectedAbility ? {
        id: selectedAbility.id,
        identifier: selectedAbility.identifier,
        name: selectedAbility.name,
      } : undefined,
      natureData: selectedNature ? {
        id: selectedNature.id,
        identifier: selectedNature.identifier,
        name: selectedNature.name,
      } : undefined,
      itemData: selectedItem ? {
        id: selectedItem.id,
        identifier: selectedItem.identifier,
        name: selectedItem.name,
        spriteUrl: selectedItem.spriteUrl,
      } : undefined,
      movesData: selectedMovesData,
    };

    onSave(config);
  };

  if (loading || !pokemon || !pokemon.base) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedNature = natures.find((n) => n.id === natureId) || null;

  // Get base stats from champions API base object
  const baseStats: StatSpread = {
    hp: pokemon.base.hpBase || 0,
    attack: pokemon.base.attackBase || 0,
    defense: pokemon.base.defenseBase || 0,
    specialAttack: pokemon.base.spAtkBase || 0,
    specialDefense: pokemon.base.spDefBase || 0,
    speed: pokemon.base.speedBase || 0,
  };

  return (
    <div className={`bg-white dark:bg-dark-bg-primary rounded-lg shadow-lg flex flex-col h-[90vh] ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
        <div className="flex items-center gap-4">
          {pokemon.base.imageUrl && (
            <img src={pokemon.base.imageUrl} alt={pokemon.base.name} className="w-20 h-20 object-contain" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              {pokemon.base.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">#{pokemon.base.nationalNumber}</p>
              <div className="flex gap-1">
                {pokemon.base.types.map((type) => (
                  <TypeIcon key={type} type={type} size="xs" />
                ))}
              </div>
            </div>
            {pokemon.forms && pokemon.forms.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFormPicker(true)}
                disabled={formLoading}
                className={`mt-2 text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  selectedFormSlug
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-dark-bg-tertiary border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                }`}
              >
                {formLoading ? t('common.loading', 'Loading...') : `${t('battleReference.changeForm', 'Change Form')} ▾`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form picker modal */}
      {showFormPicker && pokemon.forms && pokemon.forms.length > 0 && (
        <FormPickerModal
          basePokemon={pokemon.base}
          forms={pokemon.forms}
          currentSlug={selectedFormSlug}
          onSelect={(slug) => { handleFormChange(slug); setShowFormPicker(false); }}
          onClose={() => setShowFormPicker(false)}
          t={t}
        />
      )}

      {/* Content - 3 Column Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Basic Info */}
          <div className="space-y-6">
            <h3 className="text-md font-bold text-gray-900 dark:text-dark-text-primary border-b border-gray-100 dark:border-dark-border pb-2">
              {t('teamBuilder.basic', 'Basic Info')}
            </h3>


            {/* Ability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                {t('teamBuilder.ability', 'Ability')}
              </label>
              <div className="flex flex-col gap-1.5">
                {abilities.map((ability) => {
                  const isSelected = abilityIdentifier === ability.identifier;
                  const isExpanded = expandedAbility === ability.identifier;
                  return (
                    <div key={ability.identifier}>
                      <button
                        type="button"
                        onClick={() => setAbilityIdentifier(ability.identifier)}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span>{ability.name}</span>
                            {ability.isHidden && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-normal flex-shrink-0 ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                              }`}>
                                {t('teamBuilder.hidden', 'Hidden')}
                              </span>
                            )}
                          </div>
                          {ability.description && (
                            <span
                              className={`flex-shrink-0 w-4 h-4 rounded-full border text-xs flex items-center justify-center font-bold leading-none cursor-pointer ${
                                isExpanded
                                  ? 'bg-white/30 border-white text-white'
                                  : isSelected
                                    ? 'border-white/50 text-white/70 hover:bg-white/20'
                                    : 'border-gray-400 dark:border-gray-500 text-gray-400 dark:text-gray-500 hover:border-gray-600 dark:hover:border-gray-300'
                              }`}
                              title={ability.description}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedAbility(isExpanded ? null : ability.identifier);
                              }}
                            >
                              ?
                            </span>
                          )}
                        </div>
                      </button>
                      {isExpanded && ability.description && (
                        <div className="mt-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {ability.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
                {t('teamBuilder.nature', 'Nature')}
              </label>
              <button
                type="button"
                onClick={() => setShowNaturePicker(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-dark-bg-tertiary dark:border-dark-border text-left flex items-center justify-between hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-dark-text-primary truncate">
                    {selectedNature ? t(`natures.${selectedNature.identifier}`, selectedNature.name) : '—'}
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {showNaturePicker && (
                <NaturePickerModal
                  natures={natures}
                  selectedNatureId={natureId}
                  onSelect={setNatureId}
                  onClose={() => setShowNaturePicker(false)}
                />
              )}
            </div>

            {/* Held Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
                {t('teamBuilder.heldItem', 'Held Item')}
              </label>
              <button
                type="button"
                onClick={() => setShowItemPicker(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-left flex items-center justify-between dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-dark-text-primary hover:border-primary-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {selectedItem?.spriteUrl && (
                    <img src={selectedItem.spriteUrl} alt={selectedItem.name} className="w-6 h-6 object-contain" />
                  )}
                  <span>{selectedItem ? selectedItem.name : t('teamBuilder.none', 'None')}</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 dark:text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showItemPicker && (
                <ItemPickerModal
                  lang={i18n.language.startsWith('ja') ? 'ja' : 'en'}
                  selectedItem={selectedItem ? { name: selectedItem.name, spriteUrl: selectedItem.spriteUrl } : undefined}
                  onSelect={(item) => { setItemId(item.id); setSelectedItem(item); }}
                  onClear={() => { setItemId(undefined); setSelectedItem(undefined); }}
                  onClose={() => setShowItemPicker(false)}
                />
              )}
            </div>

            {/* Tera Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
                {t('teamBuilder.teraType', 'Tera Type')}
              </label>
              <div className="flex flex-wrap gap-2">
                {teraTypes.map((type) => {
                  const isSelected = teraType === type.typeName;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setTeraType(isSelected ? undefined : type.typeName)}
                      className={`relative rounded-lg transition-all ${isSelected
                        ? 'ring-2 ring-primary-600 dark:ring-primary-400 ring-offset-2 dark:ring-offset-dark-bg-primary transform scale-110 z-10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                      title={t('types.' + type.typeName.toLowerCase(), type.typeName)}
                    >
                      <TeraTypeIcon type={type.typeName} />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 h-5">
                {teraType
                  ? t('types.' + teraType.toLowerCase(), teraType)
                  : t('teamBuilder.none', 'None')
                }
              </p>
            </div>
          </div>

          {/* Column 2: Stats */}
          <div className="space-y-6">
            <h3 className="text-md font-bold text-gray-900 dark:text-dark-text-primary border-b border-gray-100 dark:border-dark-border pb-2">
              {t('teamBuilder.stats', 'Stats')}
            </h3>

            <EVInputs
              evs={evs}
              onChange={setEvs}
              baseStats={baseStats}
              nature={selectedNature}
            />
          </div>

          {/* Column 3: Moves */}
          <div className="space-y-6">
            <h3 className="text-md font-bold text-gray-900 dark:text-dark-text-primary border-b border-gray-100 dark:border-dark-border pb-2">
              {t('teamBuilder.moves', 'Moves')} ({moves.length}/4)
            </h3>

            {/* 4-slot display */}
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => {
                const m = selectedMovesData[i];
                if (!m) {
                  return (
                    <button
                      key={i}
                      onClick={() => setShowMovePicker(true)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-600 transition-colors text-sm dark:border-dark-border dark:text-dark-text-tertiary dark:hover:border-primary-500 dark:hover:text-primary-400"
                    >
                      {moves.length === i ? t('teamBuilder.selectMove', 'Select Move') : '—'}
                    </button>
                  );
                }
                return (
                  <div key={m.identifier} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-white dark:bg-dark-bg-tertiary dark:border-dark-border">
                    <TypeIcon type={m.type} size="xs" />
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-dark-text-primary truncate">
                      {getLocalizedMoveName(m, i18n.language)}
                    </span>
                    <span className="text-xs font-mono text-gray-400">{m.power ?? '—'}</span>
                    <button
                      onClick={() => {
                        const moveId = pokemon?.moves?.find(mv => mv.identifier === m.identifier)?.id;
                        setMoves(moves.filter((id) => id !== moveId));
                        setSelectedMovesData(selectedMovesData.filter((s) => s.identifier !== m.identifier));
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors ml-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
              {moves.length < 4 && (
                <button
                  onClick={() => setShowMovePicker(true)}
                  className="w-full py-1.5 text-xs text-primary-500 hover:text-primary-400 transition-colors"
                >
                  + {t('teamBuilder.addMove', 'Add Move')}
                </button>
              )}
            </div>

            {showMovePicker && pokemon && (
              <MovePicker
                pokemonName={pokemon.base.name}
                availableMoves={pokemon.moves ?? []}
                selectedMoves={selectedMovesData}
                lang={i18n.language}
                onClose={() => setShowMovePicker(false)}
                onToggleMove={(move) => {
                  const already = selectedMovesData.some((s) => s.identifier === move.identifier);
                  if (already) {
                    setMoves(moves.filter((id) => id !== (pokemon?.moves?.find(mv => mv.identifier === move.identifier)?.id)));
                    setSelectedMovesData(selectedMovesData.filter((s) => s.identifier !== move.identifier));
                  } else if (moves.length < 4) {
                    setMoves([...moves, move.id]);
                    setSelectedMovesData([...selectedMovesData, {
                      identifier: move.identifier,
                      nameEn: move.nameEn,
                      nameJa: move.nameJa ?? null,
                      type: move.type,
                      category: move.category,
                      power: move.power,
                      accuracy: move.accuracy,
                      pp: move.pp,
                    }]);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-dark-border flex-shrink-0 flex items-center justify-between bg-gray-50 dark:bg-dark-bg-tertiary rounded-b-lg">
        <div className="flex-1 mr-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium border-l-4 border-red-500 dark:border-red-400 pl-3">
              {error}
            </p>
          )}
          {!error && selectedFormSlug && MEGA_FORM_TO_STONE[selectedFormSlug] && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('teamBuilder.megaPreviewNote', 'Previewing mega form — saves as base form')}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors dark:border-dark-border dark:text-dark-text-primary dark:hover:bg-dark-bg-secondary"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            {t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
