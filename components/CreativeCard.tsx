import React, { useState } from 'react';
import { AdConcept, CreativeFormat, PlacementFormat, MindMapNode, AwarenessStage } from '../types';
import { EditIcon, ClipboardCopyIcon, SparklesIcon, RefreshCwIcon, ZapIcon, RemixIcon } from './icons';

interface CreativeCardProps {
  node: MindMapNode;
  onGenerateImage: (id: string) => void;
  onEditConcept: (id: string) => void;
  onScaleWinner: (concept: AdConcept) => void;
  onOpenLightbox: (concept: AdConcept, startIndex: number) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

export const CreativeCard: React.FC<CreativeCardProps> = ({ node, onGenerateImage, onEditConcept, onScaleWinner, onOpenLightbox, isSelected, onSelect, className = '' }) => {
    const [copyButtonText, setCopyButtonText] = useState('Salin Teks');
    const [currentSlide, setCurrentSlide] = useState(0);

    if (node.type !== 'creative') return null;
    const concept = (node.content as { concept: AdConcept }).concept;

    const handleCopy = () => {
        const textToCopy = `Headline: ${concept.headline}\nHook: ${concept.hook}`;
        navigator.clipboard.writeText(textToCopy);
        setCopyButtonText('Tersalin!');
        setTimeout(() => setCopyButtonText('Salin Teks'), 2000);
    };

    const statusMap: Record<NonNullable<AdConcept['performanceData']>['status'], { text: string; bg: string; icon: string }> = {
        'Winner': { text: 'Winner', bg: 'bg-green-500', icon: '🚀' },
        'Testing': { text: 'Testing', bg: 'bg-blue-500', icon: '🧪' },
        'Failed': { text: 'Failed', bg: 'bg-red-600', icon: '⚠️' },
        'Pending': { text: 'Pending', bg: 'bg-gray-600', icon: '🕒' },
    };

    const entryPointColorMap = {
        'Emotional': 'bg-pink-600',
        'Logical': 'bg-blue-600',
        'Social': 'bg-emerald-600',
        'Evolved': 'bg-purple-600',
        'Pivoted': 'bg-yellow-600 text-black',
        'Remixed': 'bg-cyan-500 text-black',
    };
    const entryPointIconMap = {
        'Emotional': '💖',
        'Logical': '🧠',
        'Social': '💬',
        'Evolved': '✨',
        'Pivoted': '⚡️',
        'Remixed': '🧬',
    };
    
    const totalImages = concept.imageUrls?.length || 0;
    const isCarousel = concept.placement === 'Carousel';
    const overlayPositionClass = concept.placement === 'Instagram Story' 
        ? 'top-0 bg-gradient-to-b' 
        : 'bottom-0 bg-gradient-to-t';

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentSlide(prev => (prev === 0 ? totalImages - 1 : prev - 1));
    };
    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentSlide(prev => (prev === totalImages - 1 ? 0 : prev + 1));
    };

    const currentHeadline = isCarousel && concept.carouselSlides && concept.carouselSlides[currentSlide]
        ? concept.carouselSlides[currentSlide].headline
        : concept.headline;

    const currentTextOverlay = isCarousel && concept.carouselSlides && concept.carouselSlides[currentSlide]?.textOverlay
        ? concept.carouselSlides[currentSlide].textOverlay
        : concept.textOverlay;
    
    const currentStatus = concept.performanceData?.status ? statusMap[concept.performanceData.status] : statusMap['Pending'];

    return (
        <div className={`bg-brand-surface border rounded-lg shadow-md flex flex-col transition-all duration-200 hover:shadow-brand-secondary/20 overflow-hidden w-full h-full ${isSelected ? 'border-brand-primary' : 'border-gray-700'}`}>
            <div 
                className={`relative w-full aspect-square flex-shrink-0 group ${totalImages > 0 ? 'cursor-pointer' : ''}`}
                onClick={() => {
                    if (concept.imageUrls && concept.imageUrls.length > 0) {
                        onOpenLightbox(concept, currentSlide);
                    }
                }}
            >
                 <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(node.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 rounded bg-gray-900/50 border-gray-500 text-brand-primary focus:ring-brand-primary"
                    />
                 </div>
                 {concept.isGenerating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-xs mt-2">{isCarousel ? 'Menghasilkan carousel...' : 'Menghasilkan gambar...'}</p>
                    </div>
                ) : concept.error ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/50 p-2 text-center">
                        <p className="text-sm font-semibold">Gagal</p>
                        <p className="text-xs text-white/70 mt-1">{concept.error}</p>
                         <button onClick={() => onGenerateImage(node.id)} className="mt-2 text-xs bg-brand-primary px-2 py-1 rounded hover:bg-indigo-500">Coba Lagi</button>
                    </div>
                ) : totalImages > 0 ? (
                    <>
                        <img src={concept.imageUrls![currentSlide]} alt={`${concept.headline} - slide ${currentSlide + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Main Text Overlay */}
                        {currentTextOverlay && (
                            <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/20 pointer-events-none">
                                <p 
                                    className="text-white text-center font-bold text-xl leading-tight drop-shadow-lg"
                                    style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}
                                >
                                    {currentTextOverlay}
                                </p>
                            </div>
                        )}
                        
                        {/* Headline Overlay */}
                        <div className={`absolute left-0 right-0 p-3 from-black/80 to-transparent ${overlayPositionClass} pointer-events-none`}>
                            <p className="text-white text-center font-bold text-sm drop-shadow-lg" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>{currentHeadline}</p>
                        </div>
                        
                        {totalImages > 1 && (
                            <>
                                <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                                    {currentSlide + 1} / {totalImages}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
                        <button onClick={(e) => { e.stopPropagation(); onGenerateImage(node.id); }} className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-green-500 transition-colors">
                            {isCarousel ? 'Hasilkan Carousel' : 'Hasilkan Gambar'}
                        </button>
                    </div>
                )}
            </div>
            <div className="p-3 flex-grow flex flex-col justify-between">
                <div>
                     <div className="flex justify-between items-start gap-2 mb-1">
                        <h5 className="font-bold text-sm leading-tight pr-1">{concept.headline}</h5>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                             <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${currentStatus.bg}`}>
                                {currentStatus.icon} {currentStatus.text}
                            </span>
                            {concept.entryPoint && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${entryPointColorMap[concept.entryPoint] || 'bg-gray-400'}`}>
                                    {entryPointIconMap[concept.entryPoint]} {concept.entryPoint}
                                </span>
                            )}
                            {concept.trigger && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-semibold whitespace-nowrap bg-orange-600">
                                    🔥 {concept.trigger.name}
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-brand-text-secondary line-clamp-2">{concept.hook}</p>
                    
                    {concept.performanceData && concept.performanceData.status !== 'Pending' && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-around text-center text-xs">
                            <div><span className="text-gray-400 block">CTR</span> <strong className="text-base">{concept.performanceData.ctr?.toFixed(2) ?? '-'}%</strong></div>
                            <div><span className="text-gray-400 block">CPC</span> <strong className="text-base">${concept.performanceData.cpc?.toFixed(2) ?? '-'}</strong></div>
                            <div><span className="text-gray-400 block">ROAS</span> <strong className="text-base">{concept.performanceData.roas?.toFixed(2) ?? '-'}x</strong></div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-1 mt-2">
                    <button onClick={() => onEditConcept(node.id)} title="Edit Detail & Prompt" className="text-xs bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md flex items-center justify-center gap-1"><EditIcon className="w-3 h-3"/> Detail</button>
                    <button onClick={handleCopy} title="Salin Teks" className="text-xs bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md flex items-center justify-center gap-1"><ClipboardCopyIcon className="w-3 h-3"/> {copyButtonText}</button>
                    {concept.performanceData?.status === 'Winner' && (
                        <button 
                            onClick={() => onScaleWinner(concept)}
                            className="col-span-2 text-xs bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 p-1.5 rounded-md flex items-center justify-center gap-1 font-bold"
                            title="Skalakan Pemenang Ini"
                        >
                            <ZapIcon className="w-3 h-3"/>
                            Skalakan Pemenang Ini
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};