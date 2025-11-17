import React, { useState, useEffect, useCallback } from 'react';
import { AdConcept } from '../types';
import { XIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, RefreshCwIcon } from './icons';
import saveAs from 'file-saver';
import { dataURLtoBlob, compositeTextOnImage } from '../services/exportService';

interface LightboxProps {
  concept: AdConcept;
  startIndex?: number;
  onClose: () => void;
  onSaveConcept: (conceptId: string, updatedContent: AdConcept) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ concept, startIndex = 0, onClose, onSaveConcept }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isDownloading, setIsDownloading] = useState(false);
  const images = concept.imageUrls || [];

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    try {
        const imageUrl = images[currentIndex];
        const currentSlideContent = (isCarousel && concept.carouselSlides) ? concept.carouselSlides[currentIndex] : concept;
        
        const compositedImage = await compositeTextOnImage(
            imageUrl,
            { text: currentSlideContent?.hook, style: concept.headlineStyle },
            { text: currentSlideContent?.headline, style: concept.textOverlayStyle }
        );

        const blob = dataURLtoBlob(compositedImage);
        if (blob) {
            const sanitizedAdSetName = concept.adSetName.replace(/[/\\?%*:|"<>]/g, '-');
            const extension = 'jpeg';
            const filename = `${sanitizedAdSetName}_slide_${currentIndex + 1}.${extension}`;
            saveAs(blob, filename);
        }
    } catch (error) {
        console.error("Gagal mengunduh gambar:", error);
        alert("Gagal memproses gambar untuk diunduh. Silakan coba lagi.");
    } finally {
        setIsDownloading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, handleNext, handlePrev]);

  if (!images || images.length === 0) {
    return null;
  }
  
  const isCarousel = concept.placement === 'Carousel' && concept.carouselSlides && concept.carouselSlides[currentIndex];

  const handleTextUpdate = (field: 'headline' | 'hook', value: string) => {
    if (isCarousel && concept.carouselSlides) {
      const updatedSlides = [...concept.carouselSlides];
      const slideToUpdate = updatedSlides[currentIndex];
      if (slideToUpdate && (slideToUpdate as any)[field] !== value) {
        (slideToUpdate as any)[field] = value;
         // Also update the main hook/headline for the first slide
         if (currentIndex === 0) {
            const updatedConcept = { ...concept, [field]: value, carouselSlides: updatedSlides };
            onSaveConcept(concept.id, updatedConcept);
        } else {
            const updatedConcept = { ...concept, carouselSlides: updatedSlides };
            onSaveConcept(concept.id, updatedConcept);
        }
      }
    } else {
      if ((concept as any)[field] !== value) {
        const updatedConcept = { ...concept, [field]: value };
        onSaveConcept(concept.id, updatedConcept);
      }
    }
  };


  const currentHeadline = isCarousel ? concept.carouselSlides![currentIndex].headline : concept.headline;
  const currentHook = isCarousel ? concept.carouselSlides![currentIndex].hook : concept.hook;
  
  const hasCustomStyles = !!concept.headlineStyle;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <style>{`
          @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
          }
          .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
        <button
          className="text-white hover:text-gray-300 disabled:opacity-50"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label="Download image"
          title="Unduh gambar ini"
        >
          {isDownloading ? <RefreshCwIcon className="w-8 h-8 animate-spin" /> : <DownloadIcon className="w-8 h-8" />}
        </button>
        <button
          className="text-white hover:text-gray-300"
          onClick={onClose}
          aria-label="Close"
        >
          <XIcon className="w-8 h-8" />
        </button>
      </div>

      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image area
      >
        {images.length > 1 && (
          <button
            className="absolute left-4 md:left-8 text-white bg-black/30 rounded-full p-2 hover:bg-black/60 transition-colors z-50"
            onClick={handlePrev}
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-8 h-8" />
          </button>
        )}

        <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
                src={images[currentIndex]}
                alt={`Lightbox image ${currentIndex + 1} of ${images.length}`}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            
            {/* AI-Powered Text Overlay */}
            {hasCustomStyles && concept.headlineStyle ? (
                <>
                    <div 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextUpdate('hook', e.currentTarget.textContent || '')}
                        onClick={(e) => e.stopPropagation()}
                        title="Klik untuk mengedit hook"
                        className="outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-brand-primary rounded transition-all"
                        style={{
                            position: 'absolute',
                            fontFamily: `'${concept.headlineStyle.fontFamily}', sans-serif`,
                            // Adjust font size for larger lightbox view
                            fontSize: `${concept.headlineStyle.fontSize * 1.5}vw`,
                            fontWeight: concept.headlineStyle.fontWeight,
                            color: concept.headlineStyle.color,
                            top: `${concept.headlineStyle.top}%`,
                            left: `${concept.headlineStyle.left}%`,
                            width: `${concept.headlineStyle.width}%`,
                            textAlign: concept.headlineStyle.textAlign,
                            textShadow: concept.headlineStyle.textShadow,
                            lineHeight: concept.headlineStyle.lineHeight,
                            padding: '1vw',
                            cursor: 'text',
                        }}
                    >
                        {currentHook}
                    </div>
                    {currentHeadline && concept.textOverlayStyle && (
                         <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleTextUpdate('headline', e.currentTarget.textContent || '')}
                            onClick={(e) => e.stopPropagation()}
                            title="Klik untuk mengedit headline"
                            className="outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-brand-primary rounded transition-all"
                            style={{
                                position: 'absolute',
                                fontFamily: `'${concept.textOverlayStyle.fontFamily}', sans-serif`,
                                fontSize: `${concept.textOverlayStyle.fontSize * 1.5}vw`,
                                fontWeight: concept.textOverlayStyle.fontWeight,
                                color: concept.textOverlayStyle.color,
                                top: `${concept.textOverlayStyle.top}%`,
                                left: `${concept.textOverlayStyle.left}%`,
                                width: `${concept.textOverlayStyle.width}%`,
                                textAlign: concept.textOverlayStyle.textAlign,
                                textShadow: concept.textOverlayStyle.textShadow,
                                lineHeight: concept.textOverlayStyle.lineHeight,
                                padding: '1vw',
                                cursor: 'text',
                            }}
                         >
                            {currentHeadline}
                        </div>
                    )}
                </>
            ) : (
                // Fallback for concepts without custom styles
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/20">
                    <div className="text-center">
                         <p 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleTextUpdate('hook', e.currentTarget.textContent || '')}
                            onClick={(e) => e.stopPropagation()}
                            title="Klik untuk mengedit hook"
                            className="text-white font-extrabold text-4xl leading-tight drop-shadow-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-brand-primary p-1 rounded transition-shadow cursor-text"
                            style={{textShadow: '2px 2px 6px rgba(0,0,0,0.9)'}}
                        >
                            {currentHook}
                        </p>
                        {currentHeadline && (
                            <p 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleTextUpdate('headline', e.currentTarget.textContent || '')}
                                onClick={(e) => e.stopPropagation()}
                                title="Klik untuk mengedit headline"
                                className="text-white font-semibold text-2xl mt-2 opacity-90 drop-shadow-md outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-brand-primary p-1 rounded transition-shadow cursor-text"
                                style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}
                            >
                                {currentHeadline}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>


        {images.length > 1 && (
          <button
            className="absolute right-4 md:right-8 text-white bg-black/30 rounded-full p-2 hover:bg-black/60 transition-colors z-50"
            onClick={handleNext}
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-8 h-8" />
          </button>
        )}
      </div>
       {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
            </div>
        )}
    </div>
  );
};