import React, { useState, useEffect } from 'react';
import { AdConcept, MindMapNode } from '../types';
import saveAs from 'file-saver';
import { dataURLtoBlob, compositeTextOnImage } from '../services/exportService';

// --- Ikon ---
// Impor ikon yang ada
import { 
    EditIcon, ClipboardCopyIcon, RefreshCwIcon, DownloadIcon 
} from './icons'; 
// Impor ikon BARU untuk UI yang lebih baik
import { 
    SaveIcon, XIcon, MaximizeIcon, AlertCircleIcon, CheckCircleIcon, SparklesIcon, ZapIcon, RemixIcon 
} from './icons'; // (Asumsi ikon-ikon ini ada di file icons.js Anda)

interface CreativeCardProps {
  node: MindMapNode;
  onGenerateImage: (id: string) => void;
  onEditConcept: (id: string) => void; // Ini untuk modal detail/prompt
  onOpenLightbox: (concept: AdConcept, startIndex: number) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSaveConcept: (id: string, updatedContent: AdConcept) => void; // Ini untuk menyimpan editan teks
  className?: string;
}

// --- Komponen Tag (Baru) ---
// Memindahkan logika tag ke komponen yang lebih bersih
const StatusTag: React.FC<{ status: AdConcept['performanceData']['status'] }> = ({ status = 'Pending' }) => {
  const statusMap: Record<AdConcept['performanceData']['status'], { text: string; bg: string; icon: React.ReactNode }> = {
    'Winner': { text: 'Winner', bg: 'bg-green-600 border-green-500', icon: <CheckCircleIcon className="w-3 h-3" /> },
    'Testing': { text: 'Testing', bg: 'bg-blue-600 border-blue-500', icon: <SparklesIcon className="w-3 h-3" /> },
    'Failed': { text: 'Failed', bg: 'bg-red-600 border-red-500', icon: <AlertCircleIcon className="w-3 h-3" /> },
    'Pending': { text: 'Pending', bg: 'bg-gray-600 border-gray-500', icon: <RefreshCwIcon className="w-3 h-3" /> },
  };
  const current = statusMap[status];
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex items-center gap-1.5 text-white ${current.bg} border-b-2 shadow-lg`}>
      {current.icon} {current.text}
    </span>
  );
};

const EntryPointTag: React.FC<{ entryPoint: AdConcept['entryPoint'] }> = ({ entryPoint }) => {
  if (!entryPoint) return null;
  const entryPointColorMap: Record<AdConcept['entryPoint'], string> = {
    'Emotional': 'bg-pink-600/90 border-pink-700',
    'Logical': 'bg-blue-600/90 border-blue-700',
    'Social': 'bg-emerald-600/90 border-emerald-700',
    'Evolved': 'bg-purple-600/90 border-purple-700',
    'Pivoted': 'bg-yellow-500/90 border-yellow-600 text-black',
    'Remixed': 'bg-cyan-500/90 border-cyan-600 text-black',
  };
  const entryPointIconMap: Record<AdConcept['entryPoint'], React.ReactNode> = {
    'Emotional': <span className="text-xs">💖</span>,
    'Logical': <span className="text-xs">🧠</span>,
    'Social': <span className="text-xs">💬</span>,
    'Evolved': <SparklesIcon className="w-3 h-3" />,
    'Pivoted': <ZapIcon className="w-3 h-3" />,
    'Remixed': <RemixIcon className="w-3 h-3" />,
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1.5 backdrop-blur-sm border-b ${entryPointColorMap[entryPoint] || 'bg-gray-400/90 border-gray-500'}`}>
      {entryPointIconMap[entryPoint]} {entryPoint}
    </span>
  );
};

const ValidationTag: React.FC<{ validation: AdConcept['copyQualityValidation'] | AdConcept['triggerImplementationValidation'], type: 'copy' | 'trigger' }> = ({ validation, type }) => {
    if (!validation || validation.valid) return null;
    const text = type === 'copy' ? 'Teks Lemah' : 'Pemicu Gagal';
    const color = type === 'copy' ? 'bg-yellow-600 text-black' : 'bg-orange-600 text-white';
    return (
        <span 
            className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${color}`}
            title={validation.feedback}
        >
            <AlertCircleIcon className="w-3 h-3" /> {text}
        </span>
    );
};

// --- Komponen Kartu Utama ---
// FIX: Corrected component definition from `}).` to `}) => {` to fix a major syntax error.
export const CreativeCard: React.FC<CreativeCardProps> = ({ node, onGenerateImage, onEditConcept, onOpenLightbox, isSelected, onSelect, onSaveConcept, className = '' }) => {
  // --- State Lokal ---
  const [copyButtonText, setCopyButtonText] = useState('Salin');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // --- State UI Baru ---
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState({ hook: '', headline: '' });

  if (node.type !== 'creative') return null;
  const concept = (node.content as { concept: AdConcept }).concept;
  
  // Update state edit saat konsep berubah (misalnya, setelah menyimpan)
  useEffect(() => {
    setEditText({
        hook: concept.hook || '',
        headline: concept.headline || ''
    });
  }, [concept.hook, concept.headline]);

  const copyValidation = concept.copyQualityValidation;
  const triggerValidation = concept.triggerImplementationValidation;

  const totalImages = concept.imageUrls?.length || 0;
  const isCarousel = concept.placement === 'Carousel';

  // --- Handlers ---
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `Hook: ${concept.hook}\nHeadline: ${concept.headline}`;
    // Menggunakan document.execCommand sebagai fallback di dalam iframe
    try {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);

        setCopyButtonText('Tersalin!');
        setTimeout(() => setCopyButtonText('Salin'), 2000);
    } catch (err) {
        console.error("Gagal menyalin teks:", err);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading || !concept.imageUrls || totalImages === 0) return;

    setIsDownloading(true);
    try {
      const imageUrl = concept.imageUrls[currentSlide];
      const currentSlideContent = (isCarousel && concept.carouselSlides) ? concept.carouselSlides[currentSlide] : concept;
      
      const compositedImage = await compositeTextOnImage(
        imageUrl,
        { text: currentSlideContent?.hook, style: concept.headlineStyle },
        { text: currentSlideContent?.headline, style: concept.textOverlayStyle }
      );

      const blob = dataURLtoBlob(compositedImage);
      if (blob) {
        const sanitizedAdSetName = concept.adSetName.replace(/[/\\?%*:|"<>]/g, '-');
        const extension = 'jpeg';
        const filename = `${sanitizedAdSetName}_slide_${currentSlide + 1}.${extension}`;
        saveAs(blob, filename);
      }
    } catch (error) {
      console.error("Gagal mengunduh gambar:", error);
      // Hindari alert()
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide(prev => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide(prev => (prev === totalImages - 1 ? 0 : prev + 1));
  };
  
  // --- Handlers UI Baru ---
  const handleEditToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) {
        // Batal
        setIsEditing(false);
        setEditText({ hook: concept.hook, headline: concept.headline }); // Reset ke nilai asli
    } else {
        // Mulai edit
        setIsEditing(true);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Logika untuk slide carousel
    if (isCarousel && concept.carouselSlides) {
        const updatedSlides = [...concept.carouselSlides];
        const slideToUpdate = updatedSlides[currentSlide];
        
        if (slideToUpdate && (slideToUpdate.hook !== editText.hook || slideToUpdate.headline !== editText.headline)) {
            slideToUpdate.hook = editText.hook;
            slideToUpdate.headline = editText.headline;

            // Update juga konsep utama jika ini slide pertama
            if (currentSlide === 0) {
                const updatedConcept = { ...concept, hook: editText.hook, headline: editText.headline, carouselSlides: updatedSlides };
                onSaveConcept(node.id, updatedConcept);
            } else {
                const updatedConcept = { ...concept, carouselSlides: updatedSlides };
                onSaveConcept(node.id, updatedConcept);
            }
        }
    } else {
        // Logika non-carousel
        if (concept.hook !== editText.hook || concept.headline !== editText.headline) {
            const updatedConcept = { ...concept, hook: editText.hook, headline: editText.headline };
            onSaveConcept(node.id, updatedConcept);
        }
    }
    setIsEditing(false);
  };
  
  const currentPerformance = concept.performanceData;
  const hasPerformanceData = currentPerformance && currentPerformance.status !== 'Pending';

  return (
    <div className={`bg-gray-800 border rounded-xl shadow-xl flex flex-col transition-all duration-300 overflow-hidden w-full h-full ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500' : 'border-gray-700'} ${className}`}>

      {/* === AREA GAMBAR (Pratinjau & Status) === */}
      <div 
        className="relative w-full aspect-square flex-shrink-0 group bg-gray-900"
      >
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(node.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5 rounded bg-gray-900/50 border-gray-500 text-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* --- TAG STATUS & ENTRI (Menonjol) --- */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
          <StatusTag status={concept.performanceData?.status} />
          <EntryPointTag entryPoint={concept.entryPoint} />
        </div>

        {/* --- KONTEN GAMBAR (Loading, Error, Generate) --- */}
        {concept.isGenerating ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <RefreshCwIcon className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm mt-3 font-semibold">{isCarousel ? 'Menghasilkan carousel...' : 'Menghasilkan gambar...'}</p>
          </div>
        ) : concept.error ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/50 p-4 text-center text-white">
            <AlertCircleIcon className="w-8 h-8 text-red-300" />
            <p className="text-sm font-semibold mt-2">Gagal</p>
            <p className="text-xs text-red-200/80 mt-1">{concept.error}</p>
            <button onClick={(e) => {e.stopPropagation(); onGenerateImage(node.id);}} className="mt-3 text-xs bg-indigo-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-500">
              Coba Lagi
            </button>
          </div>
        ) : totalImages > 0 ? (
          <>
            <img 
              src={concept.imageUrls![currentSlide]} 
              alt={`${concept.headline} - slide ${currentSlide + 1}`} 
              className="w-full h-full object-cover" 
            />
            {totalImages > 1 && (
              <>
                <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full z-10">
                  {currentSlide + 1} / {totalImages}
                </div>
              </>
            )}
            {/* --- AKSI HOVER --- */}
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleDownload} 
                  title="Unduh gambar ini" 
                  disabled={isDownloading}
                  className="bg-black/60 text-white rounded-full p-2.5 hover:bg-black/90 backdrop-blur-sm disabled:opacity-50"
                >
                  {isDownloading ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5" />}
                </button>
                <button 
                  onClick={(e) => {e.stopPropagation(); onOpenLightbox(concept, currentSlide);}} 
                  title="Buka Lightbox" 
                  className="bg-black/60 text-white rounded-full p-2.5 hover:bg-black/90 backdrop-blur-sm"
                >
                  <MaximizeIcon className="w-5 h-5" />
                </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <SparklesIcon className="w-8 h-8 text-green-400" />
            <button onClick={(e) => { e.stopPropagation(); onGenerateImage(node.id); }} className="mt-3 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors">
              {isCarousel ? 'Hasilkan Carousel' : 'Hasilkan Gambar'}
            </button>
          </div>
        )}
      </div>

      {/* === AREA INFO (Teks, Metrik, Aksi) === */}
      <div className="p-3 flex-grow flex flex-col justify-between">
        
        {/* --- Editor In-Place --- */}
        {isEditing ? (
          <div className="flex-grow flex flex-col">
            <label htmlFor={`hook-${node.id}`} className="text-xs font-semibold text-indigo-400 mb-1">Hook</label>
            <textarea
              id={`hook-${node.id}`}
              value={editText.hook}
              onChange={(e) => setEditText(p => ({...p, hook: e.target.value}))}
              onClick={(e) => e.stopPropagation()}
              rows={2}
              className="w-full p-1.5 text-sm bg-gray-900 rounded-md border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
            />
            <div className="mt-1 mb-2">
                <ValidationTag validation={copyValidation} type="copy" />
            </div>
            
            <label htmlFor={`headline-${node.id}`} className="text-xs font-semibold text-indigo-400 mb-1">Headline</label>
            <textarea
              id={`headline-${node.id}`}
              value={editText.headline}
              onChange={(e) => setEditText(p => ({...p, headline: e.target.value}))}
              onClick={(e) => e.stopPropagation()}
              rows={2}
              className="w-full p-1.5 text-sm bg-gray-900 rounded-md border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
            />
            {/* Tombol Simpan/Batal */}
            <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={handleEditToggle} className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1">
                    <XIcon className="w-3 h-3" /> Batal
                </button>
                <button onClick={handleSave} className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1">
                    <SaveIcon className="w-3 h-3" /> Simpan
                </button>
            </div>
          </div>
        ) : (
          /* --- Tampilan Display --- */
          <>
            <div className="flex-grow">
              <h5 className="font-bold text-sm text-white leading-snug line-clamp-3" title={concept.hook}>{concept.hook}</h5>
              <p className="text-xs text-gray-400 line-clamp-2 mt-1" title={concept.headline}>{concept.headline}</p>
              
              {/* Tag Validasi */}
              <div className="flex flex-wrap gap-2 mt-2">
                <ValidationTag validation={copyValidation} type="copy" />
                <ValidationTag validation={triggerValidation} type="trigger" />
              </div>
            </div>

            {/* --- Insight Bar (Metrik) --- */}
            {hasPerformanceData && (
              <div className="mt-3 pt-2 border-t border-gray-700/50 flex justify-around text-center text-xs">
                <div>
                  <span className="text-gray-400 block font-medium text-xs">CTR</span> 
                  <strong className="text-base text-white">{currentPerformance.ctr?.toFixed(2) ?? '-'}%</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium text-xs">CPC</span> 
                  <strong className="text-base text-white">${currentPerformance.cpc?.toFixed(2) ?? '-'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium text-xs">ROAS</span> 
                  <strong className="text-base text-white">{currentPerformance.roas?.toFixed(2) ?? '-'}x</strong>
                </div>
              </div>
            )}

            {/* --- Tombol Aksi --- */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button 
                onClick={handleEditToggle} 
                title="Edit Teks" 
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1"
              >
                <EditIcon className="w-3 h-3"/> Edit
              </button>
              <button 
                onClick={handleCopy} 
                title="Salin Teks" 
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1"
              >
                <ClipboardCopyIcon className="w-3 h-3"/> {copyButtonText}
              </button>
              <button 
                onClick={(e) => {e.stopPropagation(); onEditConcept(node.id);}} 
                title="Edit Detail & Prompt" 
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1"
              >
                <SparklesIcon className="w-3 h-3"/> Detail
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};