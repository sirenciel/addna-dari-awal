import React, { useState, useMemo, useEffect } from 'react';
// Impor Tipe (Tidak berubah)
import { MindMapNode, AdConcept, CampaignBlueprint, TargetPersona, ViewMode } from '../types';

// Impor Komponen (FilterControls tetap digunakan)
import { FilterControls, GalleryFilters } from './FilterControls';
import { CreativeCard } from './CreativeCard';

// --- Impor Ikon ---
// FIX: Mengganti AlertTriangleIcon dengan ShieldAlertIcon
// NEW: Menambahkan ikon untuk KPI Dashboard
import { 
    RefreshCwIcon, SparklesIcon, TagIcon, DownloadIcon, ShieldAlertIcon,
    TargetIcon, TrophyIcon, FlaskConicalIcon, PackageIcon, Settings2Icon,
    RocketIcon, HomeIcon, UserSquareIcon, LayoutGridIcon, NetworkIcon
} from './icons'; 

import { exportConceptsToZip } from '../services/exportService';

// --- Prop Interface (Tidak berubah) ---
interface ConceptDashboardProps {
  nodes: MindMapNode[];
  concepts: AdConcept[];
  editingConcept: AdConcept | null;
  campaignBlueprint: CampaignBlueprint | null;
  isLoading: boolean;
  onGenerateImage: (conceptId: string) => void;
  onGenerateFilteredImages: (conceptIds: string[]) => void;
  onEditConcept: (conceptId: string) => void;
  onSaveConcept: (conceptId: string, updatedContent: AdConcept) => void;
  onBatchTagConcepts: (conceptIds: string[], status: AdConcept['performanceData']['status']) => void;
  onCloseModal: () => void;
  onReset: () => void;
  onOpenLightbox: (concept: AdConcept, startIndex: number) => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
}

const CONCEPT_STATUSES: AdConcept['performanceData']['status'][] = ['Testing', 'Winner', 'Failed', 'Pending'];

// --- Utility Functions (Tidak berubah) ---
const getStatusBadgeColor = (status: AdConcept['performanceData']['status']) => {
  switch (status) {
    case 'Winner': return 'bg-green-600 hover:bg-green-700';
    case 'Testing': return 'bg-yellow-600 hover:bg-yellow-700';
    case 'Failed': return 'bg-red-600 hover:bg-red-700';
    case 'Pending': 
    default: return 'bg-gray-600 hover:bg-gray-700';
  }
}

// --- Komponen Notifikasi (Tidak berubah) ---
const NotificationBanner: React.FC<{ message: string, type: 'info' | 'error' | 'success' }> = ({ message, type }) => {
    const bgColor = type === 'info' ? 'bg-indigo-600' : type === 'error' ? 'bg-red-600' : 'bg-green-600';
    return (
      <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-2xl text-white max-w-sm ${bgColor} flex items-center`}>
        {type === 'error' && <ShieldAlertIcon className="w-5 h-5 mr-2" />}
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
};

// --- Komponen Stat Card (Baru) ---
const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-gray-800/80 p-4 rounded-xl shadow-lg border border-gray-700/50 flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color} text-white`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-extrabold text-white">{value}</p>
        </div>
    </div>
);


// --- Komponen Utama: ConceptDashboard ---
export const ConceptDashboard: React.FC<ConceptDashboardProps> = (props) => {
  const { concepts, nodes, onReset, isLoading, onGenerateFilteredImages, onBatchTagConcepts, viewMode, onSetViewMode } = props;

  // --- State Management ---
  const [filters, setFilters] = useState<GalleryFilters>({
    angle: 'all', persona: 'all', format: 'all', trigger: 'all', campaignTag: 'all', statusTag: 'all',
  });
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string, type: 'info' | 'error' | 'success' } | null>(null);

  // --- Logic Filtering & Memoization ---

  // (Baru) Ekstrak daftar Persona unik untuk navigasi sidebar
  const personaList = useMemo(() => {
    const personas: Map<string, TargetPersona> = new Map();
    nodes.forEach(n => {
        if (n.type === 'persona') {
            const persona = (n.content as { persona: TargetPersona }).persona;
            if (persona) {
                personas.set(persona.description, persona);
            }
        }
    });
    return Array.from(personas.values()).sort((a,b) => a.description.localeCompare(b.description));
  }, [nodes]);

  // (Sama) Logika filter utama
  const filteredConcepts = useMemo(() => {
    const nodesMap: Map<string, MindMapNode> = new Map(nodes.map(n => [n.id, n]));
    return concepts.filter(concept => {
      if (filters.campaignTag !== 'all' && concept.campaignTag !== filters.campaignTag) return false;
      if (filters.persona !== 'all' && concept.personaDescription !== filters.persona) return false;
      if (filters.format !== 'all' && concept.format !== filters.format) return false;
      if (filters.trigger !== 'all' && concept.trigger.name !== filters.trigger) return false;
      if (filters.statusTag !== 'all' && concept.performanceData?.status !== filters.statusTag) return false;

      if (filters.angle !== 'all') {
        const findParentAngleRecursively = (nodeId: string | undefined): boolean => {
          if (!nodeId) return false;
          const node = nodesMap.get(nodeId);
          if (!node) return false;
          if (node.type === 'angle' && node.id === filters.angle) return true;
          return findParentAngleRecursively(node.parentId);
        };
        if (!findParentAngleRecursively(concept.strategicPathId)) {
          return false;
        }
      }
      return true;
    });
  }, [concepts, filters, nodes]);

  // (Sama) Konsep yang membutuhkan gambar
  const conceptsNeedingImages = useMemo(() => {
    return filteredConcepts.filter(c => !c.isGenerating && (!c.imageUrls || c.imageUrls.length === 0));
  }, [filteredConcepts]);

  // (Sama) Statistik Entry Point (dipindahkan ke sidebar)
  const entryPointStats = useMemo(() => {
    const stats: Record<AdConcept['entryPoint'], { total: number, winners: number }> = {
      'Emotional': { total: 0, winners: 0 }, 'Logical': { total: 0, winners: 0 },
      'Social': { total: 0, winners: 0 }, 'Evolved': { total: 0, winners: 0 },
      'Pivoted': { total: 0, winners: 0 }, 'Remixed': { total: 0, winners: 0 },
    };
    concepts.forEach(c => { // Dihitung dari *semua* konsep, bukan hanya yang difilter
      if (stats[c.entryPoint]) {
        stats[c.entryPoint].total++;
        if (c.performanceData?.status === 'Winner') {
          stats[c.entryPoint].winners++;
        }
      }
    });
    return stats;
  }, [concepts]);

  // (Baru) Statistik KPI Dashboard Dinamis
  const dashboardStats = useMemo(() => {
    const total = filteredConcepts.length;
    const winners = filteredConcepts.filter(c => c.performanceData?.status === 'Winner').length;
    const testing = filteredConcepts.filter(c => c.performanceData?.status === 'Testing').length;
    const winRate = total > 0 ? Math.round((winners / total) * 100) : 0;
    
    return { total, winners, testing, winRate };
  }, [filteredConcepts]);

  // (Sama) Grup Konsep untuk Tampilan
  const filteredConceptGroups = useMemo(() => {
    // Logika ini sudah benar, akan otomatis merespon `filters.persona`
    const personaGroups: Record<string, { persona: TargetPersona | null, hypothesisGroups: Record<string, AdConcept[]> }> = {};
    const nodesMap: Map<string, MindMapNode> = new Map(nodes.map(n => [n.id, n]));

    const findParentPersonaNode = (startNodeId: string): MindMapNode | undefined => {
      let currentNode: MindMapNode | undefined = nodesMap.get(startNodeId);
      while (currentNode) {
        if (currentNode.type === 'persona') return currentNode;
        currentNode = currentNode.parentId ? nodesMap.get(currentNode.parentId) : undefined;
      }
      return undefined;
    };

    filteredConcepts.forEach(concept => {
      const personaNode = findParentPersonaNode(concept.strategicPathId);
      const personaDesc = personaNode ? (personaNode.content as { persona: TargetPersona }).persona.description : "Tidak Terkategori";

      if (!personaGroups[personaDesc]) {
        personaGroups[personaDesc] = { 
          persona: personaNode ? (personaNode.content as { persona: TargetPersona }).persona : null,
          hypothesisGroups: {}
        };
      }
      const pathId = concept.strategicPathId;
      if (!personaGroups[personaDesc].hypothesisGroups[pathId]) {
        personaGroups[personaDesc].hypothesisGroups[pathId] = [];
      }
      personaGroups[personaDesc].hypothesisGroups[pathId].push(concept);
    });
    
    // Logika sorting (tidak berubah)
    const entryPointOrder = ['Emotional', 'Logical', 'Social', 'Evolved', 'Pivoted', 'Remixed'];
    Object.values(personaGroups).forEach(pGroup => {
      Object.values(pGroup.hypothesisGroups).forEach(hGroup => {
        hGroup.sort((a, b) => {
          const indexA = entryPointOrder.indexOf(a.entryPoint);
          const indexB = entryPointOrder.indexOf(b.entryPoint);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          return a.id.localeCompare(b.id);
        });
      });
    });

    return Object.entries(personaGroups).map(([personaDesc, data]) => {
      const hypotheses = Object.entries(data.hypothesisGroups).map(([pathId, groupConcepts]) => {
        const placementNode = nodesMap.get(pathId);
        const formatNode = placementNode?.parentId ? nodesMap.get(placementNode.parentId) : undefined;
        const triggerNode = formatNode?.parentId ? nodesMap.get(formatNode.parentId) : undefined;
        let title = "Hipotesis Kreatif";
        if (triggerNode && formatNode && placementNode) {
          title = `${triggerNode.label} → ${formatNode.label} → ${placementNode.label}`;
        } else if (groupConcepts.length > 0) {
          title = `${groupConcepts[0].format} Concepts`
        }
        return { pathId, concepts: groupConcepts, title };
      });
      return { personaDesc, persona: data.persona, hypotheses };
    });
  }, [filteredConcepts, nodes]);

  // (Sama) Node Kreatif
  const creativeNodes = useMemo(() => nodes.filter(n => n.type === 'creative'), [nodes]);

  // --- Handlers (Tidak berubah) ---

  const handleBulkGenerateClick = () => {
    const idsToGenerate = conceptsNeedingImages.map(c => c.id);
    if (idsToGenerate.length > 0) {
      onGenerateFilteredImages(idsToGenerate);
      setNotification({ message: `Memulai pembuatan ${idsToGenerate.length} gambar yang difilter...`, type: 'info' });
    }
  };

  const handlePushToAds = () => {
    setNotification({
      message: "Integrasi Ads Manager akan segera hadir! Konsep yang dipilih akan dikirim sebagai draf kampanye.",
      type: 'info'
    });
  };

  const handleSelectConcept = (conceptId: string) => {
    setSelectedConcepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conceptId)) {
        newSet.delete(conceptId);
      } else {
        newSet.add(conceptId);
      }
      return newSet;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedConcepts.size === filteredConcepts.length && filteredConcepts.length > 0) {
      setSelectedConcepts(new Set());
    } else {
      setSelectedConcepts(new Set(filteredConcepts.map(c => c.id)));
    }
  };

  const handleBatchTag = (status: AdConcept['performanceData']['status']) => {
    if (selectedConcepts.size === 0) return;
    onBatchTagConcepts(Array.from(selectedConcepts), status);
    setNotification({ message: `${selectedConcepts.size} konsep berhasil ditandai sebagai '${status}'.`, type: 'info' });
    setSelectedConcepts(new Set());
  };

  const handleDownloadSelected = async () => {
    if (selectedConcepts.size === 0) return;
    setIsDownloading(true);
    const conceptsToDownload = concepts.filter(c => selectedConcepts.has(c.id) && c.imageUrls && c.imageUrls.length > 0);
    if (conceptsToDownload.length === 0) {
      setNotification({ message: "Tidak ada konsep terpilih yang memiliki gambar untuk diunduh.", type: 'error' });
      setIsDownloading(false);
      return;
    }
    try {
      await exportConceptsToZip(conceptsToDownload);
      setNotification({ message: `${conceptsToDownload.length} konsep berhasil diunduh!`, type: 'success' });
    } catch (error) {
      console.error("Gagal mengunduh konsep:", error);
      setNotification({ message: "Terjadi kesalahan saat menyiapkan unduhan Anda.", type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };


  // --- Render Component ---
  return (
    <div className="w-full min-h-screen flex bg-gray-950 text-white font-inter">

      {/* --- Sidebar (Baru) --- */}
      <aside className="w-72 flex-shrink-0 bg-gray-900/80 backdrop-blur-lg border-r border-gray-800 flex flex-col fixed top-0 left-0 h-full z-30">
        
        {/* Logo/Header Sidebar */}
        <header className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-extrabold text-indigo-400">
            CreativeAI
          </h1>
          <p className="text-sm text-gray-400">Dasbor Konsep</p>
        </header>

        {/* Navigasi Persona */}
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Target Persona</h2>
          {/* Tombol Tampilkan Semua */}
          <button
            onClick={() => setFilters(f => ({ ...f, persona: 'all' }))}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              filters.persona === 'all' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            Tampilkan Semua Persona
          </button>
          
          {/* Daftar Persona */}
          {personaList.map(persona => (
            <button
              key={persona.description}
              onClick={() => setFilters(f => ({ ...f, persona: persona.description }))}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                filters.persona === persona.description 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <UserSquareIcon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate" title={persona.description}>{persona.description}</span>
            </button>
          ))}
        </nav>

        {/* Statistik Global (dari header lama) */}
        <div className="p-4 border-t border-gray-800 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Insight Global</h2>
          <div className="bg-gray-800/50 p-3 rounded-xl shadow-inner border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">📈 Tingkat Keberhasilan Titik Masuk</h3>
            <div className="grid grid-cols-2 gap-2">
              {/* FIX: Explicitly cast `s` and `value` from Object.entries, as TypeScript may infer them as `unknown`. */}
              {Object.entries(entryPointStats).filter(([, s]) => (s as { total: number }).total > 0).map(([key, value]) => {
                const stats = value as { total: number, winners: number };
                const winRate = stats.total > 0 ? Math.round(stats.winners / stats.total * 100) : 0;
                return (
                  <div key={key} className="bg-gray-800 p-2 rounded-lg" title={`${stats.winners}/${stats.total} Pemenang`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-400">{key}</span>
                      <span className="text-xs font-bold text-green-400">{winRate}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div className="bg-green-500 h-1 rounded-full" style={{ width: `${winRate}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Aksi Global (Footer Sidebar) */}
        <footer className="p-4 border-t border-gray-800 flex gap-3">
            <button 
                onClick={onReset} 
                className="flex-1 px-3 py-2 bg-gray-700 rounded-xl shadow-md text-sm font-semibold hover:bg-gray-600 transition flex items-center justify-center gap-2"
            >
                <RefreshCwIcon className="w-4 h-4"/> Mulai Ulang
            </button>
            <button 
                onClick={handlePushToAds} 
                title="Kirim konsep ke Manajer Iklan" 
                className="bg-indigo-600 p-2 rounded-xl shadow-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
            >
                <RocketIcon className="w-5 h-5" />
            </button>
        </footer>
      </aside>

      {/* --- Konten Utama (Baru) --- */}
      <main className="flex-1 flex flex-col ml-72">
        
        {/* Header Utama (Sticky) dengan KPI & Filter */}
        <header className="flex-shrink-0 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800 p-4 sticky top-0 z-20 shadow-xl">
            {/* Baris Atas: KPI Dashboard Dinamis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard 
                    title="Total Konsep"
                    value={dashboardStats.total}
                    icon={<PackageIcon className="w-6 h-6"/>}
                    color="bg-blue-600"
                />
                <StatCard 
                    title="Pemenang"
                    value={dashboardStats.winners}
                    icon={<TrophyIcon className="w-6 h-6"/>}
                    color="bg-green-600"
                />
                <StatCard 
                    title="Win Rate"
                    value={`${dashboardStats.winRate}%`}
                    icon={<TargetIcon className="w-6 h-6"/>}
                    color="bg-indigo-600"
                />
                <StatCard 
                    title="Dalam Pengujian"
                    value={dashboardStats.testing}
                    icon={<FlaskConicalIcon className="w-6 h-6"/>}
                    color="bg-yellow-600"
                />
            </div>

            {/* Baris Bawah: Filter & Aksi Cepat */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-grow">
                     <div className="flex items-center gap-1 p-1 bg-gray-900 rounded-lg">
                        <button
                            onClick={() => onSetViewMode('dashboard')}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${viewMode === 'dashboard' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-gray-700'}`}
                        >
                            <LayoutGridIcon className="w-4 h-4" /> Gallery
                        </button>
                        <button
                            onClick={() => onSetViewMode('mindmap')}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${viewMode === 'mindmap' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-gray-700'}`}
                        >
                            <NetworkIcon className="w-4 h-4" /> Mind Map
                        </button>
                    </div>
                    <FilterControls 
                        nodes={nodes} 
                        concepts={concepts}
                        onFilterChange={(newFilters: GalleryFilters) => setFilters(f => ({...f, ...newFilters}))} 
                    />
                </div>
                {conceptsNeedingImages.length > 0 && (
                    <button 
                        onClick={handleBulkGenerateClick}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 rounded-xl shadow-lg text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-wait flex items-center gap-2 transition"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        Hasilkan {conceptsNeedingImages.length} Gambar
                    </button>
                )}
            </div>
        </header>

        {/* Area Konten Utama (Scrollable) */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8">
            {/* Kontrol Aksi Massal (Sticky saat dipilih) */}
            {selectedConcepts.size > 0 && (
                <div className="sticky top-[10.5rem] z-10 mb-6 p-4 bg-indigo-900/90 backdrop-blur-sm rounded-xl shadow-2xl border border-indigo-700/50 transition-all duration-300">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="selectAll"
                                className="h-5 w-5 rounded text-indigo-500 border-gray-500 focus:ring-indigo-500 bg-gray-700"
                                checked={filteredConcepts.length > 0 && selectedConcepts.size === filteredConcepts.length}
                                onChange={handleSelectAllFiltered}
                            />
                            <label htmlFor="selectAll" className="ml-3 text-lg font-bold text-white">
                                Pilih Semua ({selectedConcepts.size} / {filteredConcepts.length})
                            </label>
                        </div>
                        <span className="text-sm text-indigo-300 hidden sm:inline">| Aksi Massal:</span>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                            {CONCEPT_STATUSES.map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleBatchTag(status)}
                                    className={`text-sm px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition ${getStatusBadgeColor(status)}`}
                                >
                                    <TagIcon className="w-4 h-4"/> Tandai: {status}
                                </button>
                            ))}
                            <button
                                onClick={handleDownloadSelected}
                                disabled={isDownloading}
                                className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isDownloading ? (
                                    <><RefreshCwIcon className="w-4 h-4 animate-spin" /> Mengemas...</>
                                ) : (
                                    <><DownloadIcon className="w-4 h-4"/> Unduh ({selectedConcepts.size})</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grup Konsep (Persona & Hipotesis) */}
            {filteredConceptGroups.length > 0 ? (
                <div className="space-y-16">
                    {filteredConceptGroups.map(({ personaDesc, persona, hypotheses }) => (
                        <section key={personaDesc} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 shadow-xl">
                            {/* Header Persona */}
                            <header className="mb-8 border-b border-indigo-500/50 pb-4">
                                <h2 className="text-3xl font-extrabold text-indigo-400">{personaDesc}</h2>
                                {persona && <p className="text-base text-gray-400 mt-1">Target Persona: Usia {persona.age} | Tipe Kreator: {persona.creatorType}</p>}
                            </header>

                            <div className="space-y-10">
                                {hypotheses.map(({ pathId, concepts: groupConcepts, title }) => (
                                    <div key={pathId}>
                                        {/* Header Hipotesis */}
                                        <h3 className="text-xl font-semibold text-gray-300 mb-5 p-2 border-l-4 border-gray-500 bg-gray-800/30 rounded-r-md">
                                            {title}
                                            <span className="ml-3 text-sm font-normal text-gray-500">({groupConcepts.length} Konsep)</span>
                                        </h3>
                                        
                                        {/* Grid Kartu Kreatif */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                            {groupConcepts.map(concept => {
                                                const node = creativeNodes.find(n => n.id === concept.id);
                                                if (!node) return null;
                                                const nodeForCard = { ...node, content: { concept } };
                                                return (
                                                    <CreativeCard 
                                                        key={node.id} 
                                                        node={nodeForCard}
                                                        onGenerateImage={props.onGenerateImage}
                                                        onEditConcept={props.onEditConcept}
                                                        onOpenLightbox={props.onOpenLightbox}
                                                        isSelected={selectedConcepts.has(node.id)}
                                                        onSelect={handleSelectConcept}
                                                        onSaveConcept={props.onSaveConcept}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                // Status Kosong
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 p-8 border-2 border-dashed border-gray-700 rounded-2xl">
                    <ShieldAlertIcon className="w-12 h-12 text-gray-600 mb-4"/>
                    <p className="text-xl font-semibold">Tidak ada konsep kreatif yang ditemukan.</p>
                    <p className="mt-2 text-sm">Coba sesuaikan filter di atas atau pilih persona yang berbeda dari sidebar.</p>
                </div>
            )}
        </div>
      </main>

      {/* Notifikasi Banner (Global) */}
      {notification && <NotificationBanner message={notification.message} type={notification.type} />}
    </div>
  );
};