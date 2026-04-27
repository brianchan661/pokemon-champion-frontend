import { useState, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@tanstack/react-query';
import { itemsService, Item } from '@/services/itemsService';

interface ItemPickerModalProps {
  lang: string;
  selectedItem?: { name: string; spriteUrl?: string };
  onSelect: (item: Item) => void;
  onClear: () => void;
  onClose: () => void;
}

export function ItemPickerModal({ lang, selectedItem, onSelect, onClear, onClose }: ItemPickerModalProps) {
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: allItems = [], isLoading: loading } = useQuery({
    queryKey: ['champions-items', lang],
    queryFn: async () => {
      const res = await itemsService.getItems({ lang: lang as 'en' | 'ja' });
      return res.success && res.data ? res.data : [];
    },
    staleTime: 30 * 60 * 1000,
  });

  const categories = useMemo(() => {
    return Array.from(new Set(allItems.map((i) => i.category))).sort();
  }, [allItems]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (category) items = items.filter((i) => i.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [allItems, category, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border w-full max-w-md flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 dark:text-dark-text-primary">
              {t('teamBuilder.heldItem', 'Held Item')}
            </span>
            {selectedItem && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                {selectedItem.spriteUrl && <img src={selectedItem.spriteUrl} className="w-4 h-4 object-contain" alt="" />}
                <span className="text-xs font-semibold">{selectedItem.name}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary transition-colors text-lg leading-none">✕</button>
        </div>

        {/* Search + category filters */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-200 dark:border-dark-border shrink-0 space-y-2">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('battleReference.searchItems', 'Search items...')}
            className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-400"
          />
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setCategory('')}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${!category ? 'bg-primary-600/20 border-primary-500/50 text-primary-400' : 'border-gray-300 dark:border-white/10 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {t('battleReference.allCategories', 'All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? '' : cat)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors capitalize ${category === cat ? 'bg-primary-600/20 border-primary-500/50 text-primary-400' : 'border-gray-300 dark:border-white/10 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {cat.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {selectedItem && (
            <button
              onClick={() => { onClear(); onClose(); }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-b border-gray-100 dark:border-white/5"
            >
              {t('battleReference.removeItem', 'Remove item')}
            </button>
          )}
          {loading && <p className="text-xs text-gray-400 dark:text-gray-300 text-center py-6">{t('battleReference.loadingItems', 'Loading...')}</p>}
          {!loading && filtered.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-300 text-center py-6">{t('battleReference.noItemsFound', 'No items found.')}</p>}
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                {item.spriteUrl
                  ? <img src={item.spriteUrl} alt="" className="w-8 h-8 object-contain shrink-0" />
                  : <div className="w-8 h-8 rounded bg-gray-100 dark:bg-white/10 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{item.name}</p>
                  {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 line-clamp-2">{item.description}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
