import React, { useState, useEffect, useMemo } from 'react';
import { AdConcept, CarouselSlide, ALL_AWARENESS_STAGES, ALL_CREATIVE_FORMATS, CreativeFormat, CampaignBlueprint, TextStyle } from '../types';
import { refineVisualPrompt, getDesignSuggestions } from '../services/geminiService';
import { RefreshCwIcon, SparklesIcon, InfoIcon, BrushIcon } from './icons';

interface EditModalProps {
  concept: AdConcept;
  campaignBlueprint: CampaignBlueprint | null;
  onSave: (conceptId: string, updatedContent: AdConcept) => void;
  onClose: () => void;
  onGenerateImage: (conceptId: string) => void;
}

// Helper to fetch base64 from a data URL, needed for AI design suggestions
const imageUrlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (result && result.includes(',')) {
                resolve(result.split(',')[1]);
            } else {
                reject(new Error("Invalid file data URL."));
            }
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(blob);
    });
}

const CAROUSEL_ARC_VALIDATION_RULES: Record<string, Record<string, string>> = {
    'PAS': {
      slide1: 'Problem',
      slide2: 'Agitate',
      slide3: 'Solution',
      slide4: 'Proof',
      slide5: 'CTA'
    },
    'Transformation': {
        slide1: 'After',
        slide2: 'Before',
        slide3: 'Struggle',
        slide4: 'Discovery',
        slide5: 'CTA'
    },
    'Educational': {
        slide1: 'Hook',
        slide2: 'Myth',
        slide3: 'Myth',
        slide4: 'Truth',
        slide5: 'CTA'
    },
    'Testimonial Story': {
        slide1: 'Quote',
        slide2: 'Customer',
        slide3: 'Result',
        slide4: 'Product',
        slide5: 'CTA'
    }
};

const validateCarouselArc = (slides: CarouselSlide[], arc: string) => {
    const rules = CAROUSEL_ARC_VALIDATION_RULES[arc];
    if (!rules) return [];

    return slides.map((slide, i) => {
        const slideKey = `slide${i + 1}`;
        const expectedKeyword = rules[slideKey];
        if (!expectedKeyword) return { slideNumber: i + 1, expected: 'Unknown', isValid: true, actual: slide.hook };

        // Simple check if hook contains the keyword (case-insensitive)
        const isValid = slide.hook.toLowerCase().includes(expectedKeyword.toLowerCase());
        return {
            slideNumber: i + 1,
            expected: expectedKeyword,
            actual: slide.hook,
            isValid
        };
    });
};

const FORMAT_TIPS: Partial<Record<CreativeFormat, string>> = {
    'Penawaran Langsung': "Iklan statis berkinerja lebih baik dengan headline numerik (misal: '3 Alasan...') dan penawaran yang sangat jelas.",
    'UGC': "Pastikan visual dan teks terasa otentik dan tidak terlalu dipoles, seolah-olah dibuat oleh pengguna sungguhan.",
    'Sebelum & Sesudah': "Pastikan transformasi terlihat jelas dan dramatis. Perbedaan antara 'sebelum' dan 'sesudah' harus mencolok.",
    'Iklan Artikel': "Gaya visual dan headline harus meniru konten editorial yang kredibel, bukan iklan yang terang-terangan.",
};


export const EditModal: React.FC<EditModalProps> = ({ concept, campaignBlueprint, onSave, onClose, onGenerateImage }) => {
  const [formData, setFormData] = useState<AdConcept>(concept);
  const [isRefining, setIsRefining] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    setFormData(concept);
  }, [concept]);

  const carouselValidation = useMemo(() => {
    if (formData.placement === 'Carousel' && formData.carouselSlides && formData.carouselArc) {
        return validateCarouselArc(formData.carouselSlides, formData.carouselArc);
    }
    return [];
  }, [formData.carouselSlides, formData.carouselArc, formData.placement]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTriggerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setFormData(prev => ({
          ...prev,
          trigger: { ...prev.trigger, name: value }
      }));
  };
  
  const handleSlideChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number, field: keyof Omit<CarouselSlide, 'slideNumber'>) => {
      const { value } = e.target;
      const updatedSlides = formData.carouselSlides ? [...formData.carouselSlides] : [];
      if (updatedSlides[index]) {
          // @ts-ignore
          updatedSlides[index][field] = value;
          setFormData(prev => ({ ...prev, carouselSlides: updatedSlides }));
      }
  };


  const handleSave = () => {
    onSave(concept.id, formData);
  };

  const handleGenerate = () => {
      // First save any changes, then trigger regeneration
      onSave(concept.id, formData);
      onGenerateImage(concept.id);
  }

  const handleRefinePrompt = async () => {
    if (!campaignBlueprint) {
        alert("Blueprint kampanye tidak tersedia. Tidak dapat menyempurnakan prompt.");
        return;
    }
    setIsRefining(true);
    try {
        const newPrompt = await refineVisualPrompt(formData, campaignBlueprint);
        setFormData(prev => ({ ...prev, visualPrompt: newPrompt }));
    } catch (error) {
        console.error("Gagal menyempurnakan prompt visual:", error);
        alert("Gagal menyempurnakan prompt visual. Silakan coba lagi.");
    } finally {
        setIsRefining(false);
    }
  };

  const handleSuggestLayout = async () => {
    if (!concept.imageUrls || concept.imageUrls.length === 0) {
        alert("Gambar harus dibuat terlebih dahulu sebelum menyarankan tata letak.");
        return;
    }
    if (!campaignBlueprint) {
        alert("Blueprint kampanye tidak tersedia.");
        return;
    }
    setIsSuggesting(true);
    try {
        const imageBase64 = await imageUrlToBase64(concept.imageUrls[0]);
        const suggestions = await getDesignSuggestions(formData, imageBase64, campaignBlueprint);
        setFormData(prev => ({
            ...prev,
            headlineStyle: suggestions.headlineStyle,
            textOverlayStyle: suggestions.textOverlayStyle,
        }));
    } catch (e) {
        console.error("Gagal mendapatkan saran desain:", e);
        alert("Gagal mendapatkan saran desain AI. Silakan coba lagi.");
    } finally {
        setIsSuggesting(false);
    }
  };


  const tip = FORMAT_TIPS[formData.format];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Edit Konsep Kreatif</h2>
          <p className="text-sm text-brand-text-secondary">Ad Set: {formData.adSetName}</p>
        </header>
        
        <main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 overflow-y-auto">
          {/* Text Content Column */}
          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-brand-primary">Konten Teks</h3>
              <div>
                <label htmlFor="hook" className="block text-sm font-medium text-brand-text-secondary mb-1">Hook (Teks Overlay Gambar)</label>
                <input type="text" name="hook" id="hook" value={formData.hook} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-brand-primary" placeholder="Teks singkat di atas gambar"/>
              </div>
              
              <div>
                <label htmlFor="headline" className="block text-sm font-medium text-brand-text-secondary mb-1">Headline Iklan</label>
                <textarea name="headline" id="headline" rows={2} value={formData.headline} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-brand-primary" />
                {tip && (
                    <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500/40 rounded-md text-xs flex items-start gap-2 text-blue-200">
                        <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><strong>Pro Tip:</strong> {tip}</span>
                    </div>
                )}
              </div>
          </div>

          {/* Visuals & Strategy Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-primary">Gaya Visual & Strategi</h3>
             <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="visualPrompt" className="block text-sm font-medium text-brand-text-secondary">Prompt Visual Utama</label>
                    <button
                        onClick={handleRefinePrompt}
                        disabled={isRefining || !campaignBlueprint}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Hasilkan prompt visual baru berdasarkan Arahan Visual di atas"
                    >
                        {isRefining ? <RefreshCwIcon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                        Sempurnakan
                    </button>
                </div>
                <textarea name="visualPrompt" id="visualPrompt" rows={4} value={formData.visualPrompt} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-brand-primary"></textarea>
            </div>
             <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Tata Letak Teks AI</h4>
                     <button
                        onClick={handleSuggestLayout}
                        disabled={isSuggesting || !concept.imageUrls?.length}
                        className="flex items-center gap-2 text-sm px-3 py-2 bg-brand-primary hover:bg-indigo-500 rounded-md disabled:opacity-50 disabled:cursor-wait font-bold"
                        title={!concept.imageUrls?.length ? "Hasilkan gambar terlebih dahulu" : "Sarankan tata letak teks menggunakan AI"}
                    >
                        {isSuggesting ? <RefreshCwIcon className="w-4 h-4 animate-spin"/> : <BrushIcon className="w-4 h-4" />}
                        Sarankan Tata Letak
                    </button>
                </div>
                 {(formData.headlineStyle || formData.textOverlayStyle) ? (
                    <div className="mt-3 text-xs text-brand-text-secondary space-y-2">
                         {formData.headlineStyle && <p><strong>Hook:</strong> {formData.headlineStyle.fontFamily}, {formData.headlineStyle.fontSize}vw, {formData.headlineStyle.color}</p>}
                         {formData.textOverlayStyle && <p><strong>Headline:</strong> {formData.textOverlayStyle.fontFamily}, {formData.textOverlayStyle.fontSize}vw, {formData.textOverlayStyle.color}</p>}
                    </div>
                ) : (
                    <p className="mt-2 text-xs text-brand-text-secondary">Klik untuk mendapatkan saran font, ukuran, warna, dan penempatan terbaik dari AI.</p>
                )}
            </div>
          </div>
          

          {formData.placement === 'Carousel' && formData.carouselSlides && formData.carouselSlides.length > 0 && (
            <div className="md:col-span-2 space-y-3 border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-lg font-semibold text-brand-text-primary">Slide Carousel</h3>
                 {formData.carouselArc && (
                    <span className="text-sm font-bold text-brand-primary bg-brand-primary/20 px-2 py-1 rounded-md">
                        Alur: {formData.carouselArc}
                    </span>
                 )}
              </div>
               {carouselValidation.length > 0 && (
                <div className="p-2 bg-gray-900/50 rounded-md text-xs space-y-1">
                    {carouselValidation.map(v => (
                        <div key={v.slideNumber} className={`flex items-center gap-2 ${v.isValid ? 'text-green-400' : 'text-red-400'}`}>
                           <span>Slide {v.slideNumber}: Diharapkan "{v.expected}"</span>
                           {!v.isValid && <span className="font-bold">⚠️ Tidak Cocok</span>}
                        </div>
                    ))}
                </div>
               )}
              {formData.carouselSlides.map((slide, index) => (
                <div key={slide.slideNumber} className="p-3 border border-gray-600 rounded-md space-y-2">
                  <p className="text-sm font-bold">Slide {slide.slideNumber}</p>
                  <div>
                    <label className="text-xs text-brand-text-secondary mb-1 block">Hook Slide</label>
                    <input type="text" value={slide.hook} onChange={e => handleSlideChange(e, index, 'hook')} className="w-full bg-gray-800 border-gray-700 rounded p-1.5 text-sm"/>
                  </div>
                   <div>
                    <label className="text-xs text-brand-text-secondary mb-1 block">Headline Slide</label>
                    <input type="text" value={slide.headline} onChange={e => handleSlideChange(e, index, 'headline')} className="w-full bg-gray-800 border-gray-700 rounded p-1.5 text-sm" />
                  </div>
                   <div>
                    <label className="text-xs text-brand-text-secondary mb-1 block">Deskripsi Slide</label>
                    <textarea rows={2} value={slide.description} onChange={e => handleSlideChange(e, index, 'description')} className="w-full bg-gray-800 border-gray-700 rounded p-1.5 text-sm"></textarea>
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary mb-1 block">Prompt Visual Slide</label>
                    <textarea rows={2} value={slide.visualPrompt} onChange={e => handleSlideChange(e, index, 'visualPrompt')} className="w-full bg-gray-800 border-gray-700 rounded p-1.5 text-sm"></textarea>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="p-4 border-t border-gray-700 bg-brand-surface rounded-b-xl flex justify-between items-center">
            <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-brand-secondary text-white font-bold rounded-lg hover:bg-green-500 flex items-center gap-2"
            >
                <SparklesIcon className="w-4 h-4" />
                Simpan & Hasilkan Ulang Gambar
            </button>
            <div>
              <button onClick={onClose} className="px-4 py-2 text-brand-text-secondary hover:bg-gray-700 rounded-lg mr-2">Batal</button>
              <button onClick={handleSave} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-indigo-500">Simpan Perubahan</button>
            </div>
        </footer>
      </div>
    </div>
  );
};