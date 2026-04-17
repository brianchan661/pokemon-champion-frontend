import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { Share2, Twitter, Download, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { PokemonCard } from '@/components/UI/PokemonCard';
import { Team } from '@brianchan661/pokemon-champion-shared';

interface ShareButtonProps {
    team: Team;
}

export function ShareButton({ team }: ShareButtonProps) {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleTwitterShare = () => {
        const text = encodeURIComponent(`Check out my Pokemon team: ${team.name} #PokemonChampion`);
        const url = encodeURIComponent(`${window.location.origin}/teams/${team.id}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        setIsOpen(false);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/teams/${team.id}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
        setIsOpen(false);
    };

    const toBase64 = async (url: string): Promise<string> => {
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleDownloadImage = useCallback(async () => {
        if (!imageContainerRef.current) return;

        try {
            setIsGenerating(true);

            // Replace all external img src with base64 to avoid CORS issues in html-to-image
            const imgs = imageContainerRef.current.querySelectorAll<HTMLImageElement>('img');
            const origSrcs: string[] = [];
            await Promise.all(Array.from(imgs).map(async (img, i) => {
                origSrcs[i] = img.src;
                if (img.src.startsWith('http')) {
                    try {
                        img.src = await toBase64(img.src);
                    } catch {
                        img.src = '';
                    }
                }
            }));

            const dataUrl = await toPng(imageContainerRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#f3f4f6',
                skipFonts: true,
            });

            // Restore original srcs
            Array.from(imgs).forEach((img, i) => { img.src = origSrcs[i]; });

            const link = document.createElement('a');
            link.download = `${team.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_team.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setIsGenerating(false);
            setIsOpen(false);
        }
    }, [team.name]);

    return (
        <div className="flex gap-2">
            {/* Download Button - Direct Access */}
            <button
                onClick={handleDownloadImage}
                disabled={isGenerating}
                className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm flex items-center gap-2 text-sm"
                title={t('common.downloadTeamImage', 'Download team roster as image')}
            >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">{t('common.saveImage', 'Save Image')}</span>
            </button>

            {/* Share Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                    <Share2 className="w-4 h-4" />
                    {t('common.share', 'Share')}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-[200]">
                        <button
                            onClick={handleTwitterShare}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                            Twitter
                        </button>

                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                        <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                )}
            </div>

            {/* Hidden Container for Image Generation */}
            {/* Position fixed off-screen to ensure it renders but isn't visible appropriately */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0, // Move into viewport to ensure painting
                    width: '1200px',
                    zIndex: -9999, // Hide behind everything
                    pointerEvents: 'none',
                    visibility: 'visible',
                }}
                ref={imageContainerRef}
            >
                <div className="p-8 bg-gray-100 dark:bg-gray-900 grid grid-cols-3 gap-6">
                    {team.pokemon.map((p, index) => (
                        <div key={index} className="h-full"> {/* Let height fit content (grid handles row height) */}
                            <PokemonCard
                                pokemon={p}
                                variant="detailed"
                                enableLinks={false}
                                forImage={true}
                                className="h-full shadow-md"
                            />
                        </div>
                    ))}
                    {/* Fill remaining slots if any (though usually 6) */}
                    {/* Empty slots are now left blank as requested */}
                </div>
                {/* Optional Branding */}
                <div className="absolute bottom-2 right-4 text-gray-400 font-medium text-xs">
                    pokemon-champion.com
                </div>
            </div>
        </div>
    );
}
