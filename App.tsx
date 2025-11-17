

import React, { useState, useMemo } from 'react';
import { InputForm } from './components/InputForm';
import { DnaValidationStep } from './components/DnaValidationStep';
// FIX: The component was renamed to ConceptDashboard.
import { ConceptDashboard } from './components/ConceptGallery';
import { LoadingIndicator } from './components/LoadingIndicator';
import { Lightbox } from './components/Lightbox';
import { AdConcept, CampaignBlueprint, MindMapNode, AppStep, CreativeFormat, ALL_CREATIVE_FORMATS, TargetPersona, BuyingTriggerObject, ViewMode, AwarenessStage, PlacementFormat, OfferTypeObject, PainDesireObject, ObjectionObject, ALL_AWARENESS_STAGES, ALL_PLACEMENT_FORMATS } from './types';
// FIX: Changed import from generateGridForPersona, which was not exported, to the correct function name. The logic is now handled by the renamed generateGridForPersona function.
import { analyzeCampaignBlueprint, generateCreativeIdeas, analyzeLandingPage, analyzeTextToBlueprint, generatePainDesires, generateObjections, generateOfferTypes, generateHighLevelAngles, generateBuyingTriggers, generateConceptsFromPersona } from './services/geminiService';
import { EditModal } from './components/EditModal';
import { LandingPage } from './components/LandingPage';
import { MindMapView } from './components/MindMapView';

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
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
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
            parentId: personaIdMap.get(concept.personaDescription), // Link creative to its persona node
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
    // --- Mind Map Handlers ---

    const findNodeAndAncestry = (nodeId: string, allNodes: MindMapNode[]): { node: MindMapNode; ancestry: MindMapNode[] } | null => {
        const nodeMap = new Map(allNodes.map(n => [n.id, n]));
        const node = nodeMap.get(nodeId);
        if (!node) return null;

        const ancestry: MindMapNode[] = [];
        let current = node.parentId ? nodeMap.get(node.parentId) : undefined;
        while (current) {
            ancestry.unshift(current);
            current = current.parentId ? nodeMap.get(current.parentId) : undefined;
        }
        return { node, ancestry };
    };

    const createToggleHandler = async (
        nodeId: string,
        nodeType: MindMapNode['type'],
        childType: MindMapNode['type'],
        childWidth: number,
        childHeight: number,
        generationFn: (context: any) => Promise<any[]>,
        childContentKey: string,
        childLabelKey: string
    ) => {
        const result = findNodeAndAncestry(nodeId, nodes);
        if (!result || result.node.type !== nodeType || !campaignBlueprint) return;

        const { node: targetNode, ancestry } = result;
        const isExpanding = !targetNode.isExpanded;
        const hasChildren = nodes.some(n => n.parentId === nodeId);

        setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, isExpanded: isExpanding } : n)));

        if (isExpanding && !hasChildren) {
            setIsLoading(true);
            setLoadingMessage(`Generating ${childType} nodes...`);
            try {
                const context = {
                    blueprint: campaignBlueprint,
                    persona: (ancestry.find(a => a.type === 'persona')?.content as { persona: TargetPersona } | undefined)?.persona || (targetNode.content as { persona: TargetPersona }).persona,
                    painDesire: (targetNode.content as { painDesire: PainDesireObject }).painDesire,
                    objection: (targetNode.content as { objection: ObjectionObject }).objection,
                    offer: (targetNode.content as { offer: OfferTypeObject }).offer,
                    awareness: (targetNode.content as { awareness: AwarenessStage }).awareness,
                    angle: (targetNode.content as { angle: string }).angle,
                    trigger: (targetNode.content as { trigger: BuyingTriggerObject }).trigger,
                    format: (targetNode.content as { format: CreativeFormat }).format,
                };

                const items = await generationFn(context);
                // FIX: Cast the dynamically created content object to the MindMapNode['content'] type to resolve TypeScript error.
                const newNodes: MindMapNode[] = items.map(item => ({
                    id: simpleUUID(),
                    parentId: nodeId,
                    type: childType,
                    label: item[childLabelKey],
                    content: { [childContentKey]: item } as MindMapNode['content'],
                    position: { x: 0, y: 0 },
                    width: childWidth,
                    height: childHeight,
                    isExpanded: false,
                }));
                setNodes(prev => [...prev, ...newNodes]);
            } catch (e: any) {
                setError(e.message || `Failed to generate ${childType}s.`);
                setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, isExpanded: false } : n)));
            } finally {
                setIsLoading(false);
                setLoadingMessage('');
            }
        }
    };
    
    const createStaticToggleHandler = (nodeId: string, nodeType: MindMapNode['type'], childType: MindMapNode['type'], childContentKey: string, staticItems: readonly any[], childWidth: number, childHeight: number) => {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (!targetNode || targetNode.type !== nodeType) return;
        
        const isExpanding = !targetNode.isExpanded;
        const hasChildren = nodes.some(n => n.parentId === nodeId);
        
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isExpanded: isExpanding } : n));
        
        if(isExpanding && !hasChildren) {
            // FIX: Cast the dynamically created content object to the MindMapNode['content'] type to resolve TypeScript error.
            const newNodes: MindMapNode[] = staticItems.map(item => ({
                id: simpleUUID(),
                parentId: nodeId,
                type: childType,
                label: item,
                content: { [childContentKey]: item } as MindMapNode['content'],
                position: { x: 0, y: 0 },
                width: childWidth,
                height: childHeight,
                isExpanded: false
            }));
            setNodes(prev => [...prev, ...newNodes]);
        }
    };

    const handleTogglePersona = (nodeId: string) => createToggleHandler(nodeId, 'persona', 'pain_desire', 250, 150, (ctx) => generatePainDesires(ctx.blueprint, ctx.persona), 'painDesire', 'name');
    const handleTogglePainDesire = (nodeId: string) => createToggleHandler(nodeId, 'pain_desire', 'objection', 250, 150, (ctx) => generateObjections(ctx.blueprint, ctx.persona, ctx.painDesire), 'objection', 'name');
    const handleToggleObjection = (nodeId: string) => createToggleHandler(nodeId, 'objection', 'offer', 250, 150, (ctx) => generateOfferTypes(ctx.blueprint, ctx.persona, ctx.objection), 'offer', 'name');
    const handleToggleOffer = (nodeId: string) => createStaticToggleHandler(nodeId, 'offer', 'awareness', 'awareness', ALL_AWARENESS_STAGES, 200, 80);
    const handleToggleAwareness = (nodeId: string) => createToggleHandler(nodeId, 'awareness', 'angle', 250, 120, (ctx) => generateHighLevelAngles(ctx.blueprint, ctx.persona, ctx.awareness, ctx.objection, ctx.painDesire, ctx.offer), 'angle', 'toString');
    const handleToggleAngle = (nodeId: string) => createToggleHandler(nodeId, 'angle', 'trigger', 250, 120, (ctx) => generateBuyingTriggers(ctx.blueprint, ctx.persona, ctx.angle, ctx.awareness), 'trigger', 'name');
    const handleToggleTrigger = (nodeId: string) => createStaticToggleHandler(nodeId, 'trigger', 'format', 'format', ALL_CREATIVE_FORMATS, 200, 80);
    const handleToggleFormat = (nodeId: string) => createStaticToggleHandler(nodeId, 'format', 'placement', 'placement', ALL_PLACEMENT_FORMATS, 200, 80);
    
    const handleTogglePlacement = async (nodeId: string, options?: { isUgcPack?: boolean, preferredCarouselArc?: string }) => {
        const result = findNodeAndAncestry(nodeId, nodes);
        if (!result || result.node.type !== 'placement' || !campaignBlueprint) return;
        const { node: targetNode, ancestry } = result;

        const isExpanding = !targetNode.isExpanded;
        const hasChildren = nodes.some(n => n.parentId === nodeId);
        setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, isExpanded: isExpanding } : n)));
        
        if (isExpanding && !hasChildren) {
             setIsLoading(true);
             setLoadingMessage('Generating creative concepts...');
             try {
                const persona = (ancestry.find(a => a.type === 'persona')?.content as { persona: TargetPersona }).persona;
                const angle = (ancestry.find(a => a.type === 'angle')?.content as { angle: string }).angle;
                const trigger = (ancestry.find(a => a.type === 'trigger')?.content as { trigger: BuyingTriggerObject }).trigger;
                const awareness = (ancestry.find(a => a.type === 'awareness')?.content as { awareness: AwarenessStage }).awareness;
                const format = (ancestry.find(a => a.type === 'format')?.content as { format: CreativeFormat }).format;
                const offer = (ancestry.find(a => a.type === 'offer')?.content as { offer: OfferTypeObject }).offer;
                const placement = (targetNode.content as { placement: PlacementFormat }).placement;

                const ideas = await generateCreativeIdeas(campaignBlueprint, angle, trigger, awareness, format, placement, persona, nodeId, allowVisualExploration, offer, options?.preferredCarouselArc);

                const newNodes: MindMapNode[] = ideas.map(concept => ({
                    id: concept.id,
                    parentId: nodeId,
                    type: 'creative',
                    label: concept.headline,
                    content: { concept },
                    position: { x: 0, y: 0 },
                    width: 160,
                    height: 240,
                }));
                setNodes(prev => [...prev, ...newNodes]);
            } catch(e: any) {
                 setError(e.message || 'Failed to generate concepts.');
                 setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isExpanded: false } : n));
            } finally {
                setIsLoading(false);
                setLoadingMessage('');
            }
        }
    };

    const handleDeleteNode = (nodeId: string) => {
        if (!window.confirm("Yakin ingin menghapus node ini beserta turunannya? Aksi ini tidak dapat dibatalkan.")) return;
        setNodes(prev => {
            const nodesToDelete = new Set<string>();
            const queue = [nodeId];
            nodesToDelete.add(nodeId);
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                const children = prev.filter(n => n.parentId === currentId);
                children.forEach(child => {
                    nodesToDelete.add(child.id);
                    queue.push(child.id);
                });
            }
            return prev.filter(n => !nodesToDelete.has(n.id));
        });
    };

    const handleGenerateConceptsForPersona = async (personaNodeId: string) => {
        const personaNode = nodes.find(n => n.id === personaNodeId);
        if(!personaNode || personaNode.type !== 'persona' || !campaignBlueprint) return;
        
        setIsLoading(true);
        setLoadingMessage(`Generating concept pack for ${personaNode.label}...`);
        try {
            const { persona } = personaNode.content as { persona: TargetPersona };
            const concepts = await generateConceptsFromPersona(campaignBlueprint, persona, personaNodeId);
            const newNodes: MindMapNode[] = concepts.map(c => ({
                id: c.id,
                parentId: personaNodeId,
                type: 'creative',
                label: c.headline,
                content: { concept: c },
                position: {x: 0, y: 0},
                width: 160,
                height: 240,
            }));
            setNodes(prev => [...prev, ...newNodes]);
            if(!personaNode.isExpanded) {
                setNodes(prev => prev.map(n => n.id === personaNodeId ? {...n, isExpanded: true} : n));
            }
        } catch (e: any) {
            setError(e.message || 'Failed to quick-generate concepts.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }
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
                {viewMode === 'dashboard' ? (
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
                        viewMode={viewMode}
                        onSetViewMode={setViewMode}
                    />
                ) : (
                    <MindMapView
                        nodes={nodes}
                        campaignBlueprint={campaignBlueprint}
                        onGenerateImage={handleGenerateImage}
                        onEditConcept={handleEditConcept}
                        onSaveConcept={handleSaveConcept}
                        onOpenLightbox={(concept, startIndex) => setLightboxData({ concept, startIndex })}
                        viewMode={viewMode}
                        onSetViewMode={setViewMode}
                        onDeleteNode={handleDeleteNode}
                        onTogglePersona={handleTogglePersona}
                        onTogglePainDesire={handleTogglePainDesire}
                        onToggleObjection={handleToggleObjection}
                        onToggleOffer={handleToggleOffer}
                        onToggleAwareness={handleToggleAwareness}
                        onToggleAngle={handleToggleAngle}
                        onToggleTrigger={handleToggleTrigger}
                        onToggleFormat={handleToggleFormat}
                        onTogglePlacement={handleTogglePlacement}
                        onGenerateConceptsForPersona={handleGenerateConceptsForPersona}
                        // Placeholders for unimplemented features
                        onScaleWinner={(c) => alert(`Scaling winner: ${c.headline}`)}
                        onReset={handleReset}
                        onGenerateMorePersonas={() => alert('Generating more personas...')}
                        onAddCustomPersona={() => alert('Adding custom persona...')}
                    />
                )}
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