import { TypeIcon } from './TypeIcon';

interface TeraTypeIconProps {
    type: string;
}

export function TeraTypeIcon({ type }: TeraTypeIconProps) {
    const getTypeColor = (t: string) => {
        const colors: Record<string, string> = {
            water: 'from-blue-400 to-blue-600', fire: 'from-red-400 to-red-600', grass: 'from-green-400 to-green-600',
            electric: 'from-yellow-300 to-yellow-500', flying: 'from-indigo-300 to-indigo-500', bug: 'from-lime-400 to-lime-600',
            ground: 'from-amber-500 to-amber-700', rock: 'from-stone-400 to-stone-600', steel: 'from-slate-300 to-slate-500',
            ice: 'from-cyan-200 to-cyan-400', ghost: 'from-purple-500 to-purple-700', dark: 'from-neutral-600 to-neutral-800',
            psychic: 'from-pink-400 to-pink-600', fairy: 'from-rose-200 to-rose-400', dragon: 'from-violet-500 to-violet-700',
            poison: 'from-fuchsia-500 to-fuchsia-700', fighting: 'from-orange-500 to-orange-700', normal: 'from-stone-300 to-stone-500'
        };
        return colors[t.toLowerCase()] || 'from-gray-400 to-gray-600';
    };

    return (
        <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Crystal Shape Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getTypeColor(type)} opacity-20 rotate-45 rounded-sm border border-current text-gray-400/30`}></div>
            <div className={`absolute inset-1 bg-gradient-to-br ${getTypeColor(type)} opacity-40 rotate-45 rounded-sm`}></div>

            {/* Icon */}
            <div className="relative z-10 transform scale-75">
                <TypeIcon type={type} size="md" />
            </div>

            {/* Shine effect */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-white opacity-40 blur-sm rounded-full transform -translate-x-1 translate-y-1"></div>
        </div>
    );
}
