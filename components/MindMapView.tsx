import React from 'react';
import { MindMapNode, AdConcept, CampaignBlueprint, ViewMode, TargetPersona, AwarenessStage, BuyingTriggerObject, CreativeFormat, PlacementFormat } from '../types';
import { MindMapCanvas } from './MindMapCanvas';
import { LayoutGridIcon, NetworkIcon } from './icons';

// Daftar prop yang lengkap, berdasarkan App.tsx Anda
interface MindMapViewProps {
    nodes: MindMapNode[];
    campaignBlueprint: CampaignBlueprint | null;
    viewMode: ViewMode;
    onSetViewMode: (mode: ViewMode) => void;
    onGenerateImage: (id: string) => void;
    onEditConcept: (id: string) => void;
    onSaveConcept: (id: string, updatedContent: AdConcept) => void;
    onScaleWinner: (concept: AdConcept) => void;
    onOpenLightbox: (concept: AdConcept, startIndex: number) => void;
    onDeleteNode: (id: string) => void;
    onReset: () => void;
    onGenerateMorePersonas: () => void;
    onAddCustomPersona: () => void;
    onGenerateConceptsForPersona: (id: string) => void;
    
    // Semua prop onToggle yang diperlukan untuk interaktivitas
    onTogglePersona: (nodeId: string) => void;
    onTogglePainDesire: (nodeId: string) => void;
    onToggleObjection: (nodeId: string) => void;
    onToggleOffer: (nodeId: string) => void;
    onToggleAngle: (nodeId: string) => void;
    onToggleTrigger: (nodeId: string) => void;
    onToggleAwareness: (nodeId: string) => void;
    onToggleFormat: (nodeId: string) => void;
    onTogglePlacement: (nodeId: string, options?: { isUgcPack?: boolean, preferredCarouselArc?: string }) => void;
}

export const MindMapView: React.FC<MindMapViewProps> = (props) => {
  return (
    <div className="w-full h-screen flex flex-col bg-gray-950 text-white">
      {/* Header dengan tombol ganti mode (view switcher) */}
      <header className="flex-shrink-0 bg-brand-surface border-b border-gray-700 p-4 flex justify-between items-center z-20">
        <div>
          <h1 className="text-xl font-bold">Peta Strategi Kreatif</h1>
          <p className="text-sm text-brand-text-secondary">Visualisasikan dan bangun alur kampanye Anda.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-gray-900 rounded-lg">
          <button
            onClick={() => props.onSetViewMode('dashboard')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${props.viewMode === 'dashboard' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-gray-700'}`}
          >
            <LayoutGridIcon className="w-4 h-4" /> Dasbor Galeri
          </button>
          <button
            onClick={() => props.onSetViewMode('mindmap')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${props.viewMode === 'mindmap' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-gray-700'}`}
          >
            <NetworkIcon className="w-4 h-4" /> Peta Strategi
          </button>
        </div>
      </header>
      
      {/* Main canvas area */}
      <main className="flex-grow relative">
        {/* Me-render MindMapCanvas yang sebenarnya dan meneruskan SEMUA prop. */}
        <MindMapCanvas 
          nodes={props.nodes}
          onTogglePersona={props.onTogglePersona}
          onTogglePainDesire={props.onTogglePainDesire}
          onToggleObjection={props.onToggleObjection}
          onToggleOffer={props.onToggleOffer}
          onToggleAngle={props.onToggleAngle}
          onToggleTrigger={props.onToggleTrigger}
          onToggleAwareness={props.onToggleAwareness}
          onToggleFormat={props.onToggleFormat}
          onTogglePlacement={props.onTogglePlacement}
          onGenerateImage={props.onGenerateImage}
          onEditConcept={props.onEditConcept}
          onSaveConcept={props.onSaveConcept}
          onScaleWinner={props.onScaleWinner}
          onOpenLightbox={props.onOpenLightbox}
          onDeleteNode={props.onDeleteNode}
          onReset={props.onReset}
          onGenerateMorePersonas={props.onGenerateMorePersonas}
          onAddCustomPersona={props.onAddCustomPersona}
          onGenerateConceptsForPersona={props.onGenerateConceptsForPersona}
        />
      </main>
    </div>
  );
};