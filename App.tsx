

import React, { useState, useMemo } from 'react';
import { InputForm } from './components/InputForm';
import { DnaValidationStep } from './components/DnaValidationStep';
// FIX: The component was renamed to ConceptDashboard.
import { ConceptDashboard } from './components/ConceptGallery';
import { LoadingIndicator } from './components/LoadingIndicator';
import { Lightbox } from './components/Lightbox';
import { AdConcept, CampaignBlueprint, MindMapNode, AppStep, CreativeFormat, ALL_CREATIVE_FORMATS, TargetPersona, BuyingTriggerObject } from './types';
// FIX: Changed import from generateGridForPersona, which was not exported, to the correct function name. The logic is now handled by the renamed generateGridForPersona function.
import { analyzeCampaignBlueprint, generateCreativeIdeas, analyzeLandingPage, analyzeTextToBlueprint } from './services/geminiService';
import { EditModal } from './components/EditModal';
import { LandingPage } from './components/LandingPage';

// Simple UUID generator
function simpleUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface CampaignSelections {
    personas: TargetPersona[];
    angles: string[];
    hooks: BuyingTriggerObject[];
    formats: CreativeFormat[];
}


function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [campaignBlueprint, setCampaignBlueprint] = useState<CampaignBlueprint | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [lightboxData, setLightboxData] = useState<{ concept: AdConcept, startIndex: number } | null>(null);
  const [allowVisualExploration, setAllowVisualExploration] = useState<boolean>(true);


  const processBlueprint = (blueprint: CampaignBlueprint, imageBase64?: string) => {
    setCampaignBlueprint(blueprint);
    if(imageBase64) setReferenceImage(imageBase64);
    setCurrentStep('validateBlueprint');
  }

  const handleGenerateFromAd = async (imageBase64: string, caption: string, productInfo: string, offerInfo: string) => {
    setIsLoading(true);
    setError(null);
    setCampaignBlueprint(null);
    setNodes([]);
    setLoadingMessage('Menganalisis Blueprint Kampanye dari Iklan...');

    try {
      const blueprint = await analyzeCampaignBlueprint(imageBase64, caption, productInfo, offerInfo);
      processBlueprint(blueprint, imageBase64);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Gagal menganalisis blueprint kampanye.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateFromUrl = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Menganalisis Blueprint dari URL...');
    try {
      const blueprint = await analyzeLandingPage(url);
      processBlueprint(blueprint);
    } catch (e: any) {
        console.error(e);
        setError(e.message || 'Gagal menganalisis URL.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateFromText = async (text: string) => {
      setIsLoading(true);
      setError(null);
      setLoadingMessage('Membuat Blueprint dari Teks...');
      try {
          const blueprint = await analyzeTextToBlueprint(text);
          processBlueprint(blueprint);
      } catch (e: any) {
          console.error(e);
          setError(e.message || 'Gagal membuat blueprint dari teks.');
      } finally {
          setIsLoading(false);
      }
  };


  const handleStartCampaign = (validatedBlueprint: CampaignBlueprint, selections: CampaignSelections) => {
      handleGenerateMatrixCampaign(validatedBlueprint, selections);
  };

const handleGenerateMatrixCampaign = async (validatedBlueprint: CampaignBlueprint, selections: CampaignSelections) => {
    setCampaignBlueprint(validatedBlueprint);
    setCurrentStep('dashboard');
    setIsLoading(true);
    setError(null);

    const { personas, angles, hooks, formats } = selections;
    
    const allCombinations: { persona: TargetPersona, angle: string, hook: BuyingTriggerObject, format: CreativeFormat }[] = [];
    for (const persona of personas) {
        for (const angle of angles) {
            for (const hook of hooks) {
                for (const format of formats) {
                    allCombinations.push({ persona, angle, hook, format });
                }
            }
        }
    }
    
    const totalConcepts = allCombinations.length;

    try {
        const campaignTag = `Matriks ${personas.length}x${angles.length}x${hooks.length}x${formats.length} - ${new Date().toLocaleTimeString()}`;
        setLoadingMessage('Membuat Blueprint Kampanye...');
        const dnaNode: MindMapNode = {
            id: 'dna-root', type: 'dna', label: 'Blueprint Kampanye', content: validatedBlueprint,
            position: { x: 0, y: 0 }, width: 300, height: 420
        };
        
        setLoadingMessage(`Menyiapkan ${personas.length} persona...`);
        
        const personaNodes: MindMapNode[] = personas.map(persona => ({
            id: simpleUUID(),
            parentId: dnaNode.id,
            type: 'persona',
            label: persona.description,
            content: { persona },
            position: { x: 0, y: 0 },
            isExpanded: false,
            width: 250, height: 180,
        }));

        const personaIdMap = new Map<string, string>();
        personaNodes.forEach(node => {
            const personaDesc = (node.content as { persona: TargetPersona }).persona.description;
            personaIdMap.set(personaDesc, node.id);
        });
        
        setNodes([dnaNode, ...personaNodes]);
        
        setLoadingMessage(`Menghasilkan ${totalConcepts * 3} variasi konsep untuk ${totalConcepts} kombinasi...`);
        
        const conceptPromises = allCombinations.map((combo, index) => {
            setLoadingMessage(`Menghasilkan kombinasi ${index + 1}/${totalConcepts}...`);
            const strategicPathId = personaIdMap.get(combo.persona.description) || 'dna-root';
            // Hardcoding awareness and placement for simplicity in this flow. Could be added as a selection later.
            const awarenessStage = 'Sadar Masalah';
            const placement = 'Instagram Feed';
            const offer = { name: validatedBlueprint.adDna.offerSummary, description: validatedBlueprint.adDna.offerSummary, psychologicalPrinciple: 'Direct Offer' as const };
            
            return generateCreativeIdeas(validatedBlueprint, combo.angle, combo.hook, awarenessStage, combo.format, placement, combo.persona, strategicPathId, allowVisualExploration, offer);
        });

        const conceptArrays = await Promise.all(conceptPromises);
        const allNewConcepts = conceptArrays.flat();
        const taggedConcepts = allNewConcepts.map(c => ({ ...c, campaignTag }));

        const creativeNodes: MindMapNode[] = taggedConcepts.map(concept => ({
            id: concept.id,
            parentId: concept.strategicPathId,
            type: 'creative',
            label: concept.headline,
            content: { concept },
            position: { x: 0, y: 0 },
            width: 160,
            height: 240,
        }));
        
        setNodes(prev => [...prev, ...creativeNodes]);

    } catch (e: any) {
        console.error("Pembuatan Matriks Kreatif gagal:", e);
        setError(e.message || "Gagal menjalankan Pembuatan Matriks Kreatif.");
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
};
  
  // --- Image Generation & Content Management ---

  const handleGenerateImage = async (conceptId: string) => {
    setNodes(prev => prev.map(n => n.id === conceptId ? { ...n, content: { concept: { ...(n.content as { concept: AdConcept }).concept, isGenerating: true, error: undefined } } } : n));
    try {
        const conceptNode = nodes.find(n => n.id === conceptId);
        if (!conceptNode || conceptNode.type !== 'creative') throw new Error("Concept not found");
        const concept = (conceptNode.content as { concept: AdConcept }).concept;
        
        const { generateAdImage } = await import('./services/geminiService');
        
        const imageUrl = await generateAdImage(concept.visualPrompt, referenceImage ?? undefined, allowVisualExploration);
        
        let newImageUrls = [imageUrl];
        if (concept.placement === 'Carousel' && concept.carouselSlides) {
            const slidePromises = concept.carouselSlides.slice(1).map(slide => {
                const slideConcept: AdConcept = {
                    ...concept, // inherit base properties
                    headline: slide.headline,
                    visualPrompt: slide.visualPrompt,
                    // FIX: The property 'textOverlay' does not exist on AdConcept or CarouselSlide. It should be 'hook'.
                    hook: slide.hook,
                    carouselSlides: undefined, // Avoid recursion
                };
                return generateAdImage(slideConcept.visualPrompt, referenceImage ?? undefined, allowVisualExploration);
            });

            const slideImages = await Promise.all(slidePromises);
            newImageUrls = [imageUrl, ...slideImages];
        }

        setNodes(prev => prev.map(n => n.id === conceptId ? { ...n, content: { concept: { ...concept, isGenerating: false, imageUrls: newImageUrls } } } : n));
    } catch (e: any) {
        console.error("Image generation failed for", conceptId, e);
        setNodes(prev => prev.map(n => n.id === conceptId ? { ...n, content: { concept: { ...(n.content as { concept: AdConcept }).concept, isGenerating: false, error: e.message || "Request was blocked or failed." } } } : n));
    }
  };

  const handleGenerateFilteredImages = async (conceptIds: string[]) => {
      setNodes(prev => prev.map(n => conceptIds.includes(n.id) ? { ...n, content: { concept: { ...(n.content as { concept: AdConcept }).concept, isGenerating: true, error: undefined } } } : n));
      
      const generationPromises = conceptIds.map(id => handleGenerateImage(id));
      await Promise.allSettled(generationPromises);
  };
  
  const handleEditConcept = (conceptId: string) => setEditingConceptId(conceptId);
  const handleCloseModal = () => setEditingConceptId(null);
  
  const handleSaveConcept = (conceptId: string, updatedContent: AdConcept) => {
      setNodes(prev => prev.map(n => n.id === conceptId ? { ...n, label: updatedContent.headline, content: { concept: updatedContent } } : n));
      setEditingConceptId(null);
      if (lightboxData && lightboxData.concept.id === conceptId) {
          // Also update the concept in the lightbox if it's open
          setLightboxData(prev => prev ? { ...prev, concept: updatedContent } : null);
      }
  };

  const handleBatchTagConcepts = (conceptIds: string[], status: AdConcept['performanceData']['status']) => {
      setNodes(prev => prev.map(n => {
          if (conceptIds.includes(n.id)) {
              const concept = (n.content as { concept: AdConcept }).concept;
              return { ...n, content: { concept: { ...concept, performanceData: { ...concept.performanceData, status: status } } } };
          }
          return n;
      }));
  };
  
  const allConcepts = useMemo(() => {
    return nodes
        .filter(node => node.type === 'creative')
        .map(node => (node.content as { concept: AdConcept }).concept);
  }, [nodes]);

  const editingConcept = useMemo(() => {
    if (!editingConceptId) return null;
    const node = nodes.find(n => n.id === editingConceptId);
    return node ? (node.content as { concept: AdConcept }).concept : null;
  }, [editingConceptId, nodes]);

  const handleReset = () => {
    if (window.confirm("Anda yakin ingin memulai ulang? Semua progres akan hilang.")) {
        setCurrentStep('input');
        setCampaignBlueprint(null);
        setNodes([]);
        setError(null);
        setReferenceImage(null);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'landing':
        return <LandingPage onStart={() => setCurrentStep('input')} />;

      case 'input':
        return <div className="min-h-screen flex items-center justify-center">
            <InputForm 
                onGenerateFromAd={handleGenerateFromAd}
                onGenerateFromUrl={handleGenerateFromUrl}
                onGenerateFromText={handleGenerateFromText}
            />
        </div>;
      
      case 'validateBlueprint':
        if (campaignBlueprint) {
          return <DnaValidationStep 
                    initialBlueprint={campaignBlueprint} 
                    referenceImage={referenceImage || ''} 
                    onStartCampaign={handleStartCampaign}
                    onBack={handleReset}
                    allowVisualExploration={allowVisualExploration}
                    onAllowVisualExplorationChange={setAllowVisualExploration}
                 />;
        }
        return <LoadingIndicator message="Memuat blueprint..." />;

      case 'dashboard':
        return (
            <div className="relative w-full h-screen">
                <ConceptDashboard 
                    nodes={nodes}
                    concepts={allConcepts}
                    editingConcept={editingConcept}
                    campaignBlueprint={campaignBlueprint}
                    isLoading={isLoading}
                    onGenerateImage={handleGenerateImage}
                    onGenerateFilteredImages={handleGenerateFilteredImages}
                    onEditConcept={handleEditConcept}
                    onSaveConcept={handleSaveConcept}
                    onBatchTagConcepts={handleBatchTagConcepts}
                    onCloseModal={handleCloseModal}
                    onReset={handleReset}
                    onOpenLightbox={(concept, startIndex) => setLightboxData({ concept, startIndex })}
                />
            </div>
        );

      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="w-full h-full bg-brand-background text-brand-text-primary relative">
        {isLoading && currentStep !== 'landing' && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
                <LoadingIndicator message={loadingMessage || 'Memproses...'} />
            </div>
        )}
         {error && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white p-4 rounded-lg shadow-lg max-w-md">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
                <button onClick={() => setError(null)} className="absolute top-1 right-2 text-xl">&times;</button>
            </div>
        )}
        {editingConcept && campaignBlueprint && (
            <EditModal 
                concept={editingConcept} 
                campaignBlueprint={campaignBlueprint}
                onSave={handleSaveConcept} 
                onClose={handleCloseModal}
                onGenerateImage={handleGenerateImage}
            />
        )}
         {lightboxData && (
            <Lightbox 
                concept={lightboxData.concept} 
                startIndex={lightboxData.startIndex} 
                onClose={() => setLightboxData(null)} 
                onSaveConcept={handleSaveConcept}
            />
        )}
        {renderStep()}
    </div>
  );
}

export default App;