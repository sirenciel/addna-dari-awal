
import React, { useState, useMemo, useEffect } from 'react';
import { CampaignBlueprint, TargetPersona, BuyingTriggerObject, CreativeFormat, ALL_CREATIVE_FORMATS } from '../types';
import { InfoIcon, RemixIcon } from './icons';
import { generateCampaignOptions, CampaignOptions } from '../services/geminiService';
import { CampaignSelections } from '../App';

interface BlueprintValidationStepProps {
  initialBlueprint: CampaignBlueprint;
  referenceImage: string;
  onStartCampaign: (validatedBlueprint: CampaignBlueprint, selections: CampaignSelections) => void;
  onBack: () => void;
  allowVisualExploration: boolean;
  onAllowVisualExplorationChange: (checked: boolean) => void;
}

const EditableField: React.FC<{label: string, value: string, name: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({label, value, name, onChange}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <input type="text" id={name} name={name} value={value} onChange={onChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-brand-primary"/>
    </div>
);

const EditableTextarea: React.FC<{label: string, value: string, name: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, rows?: number}> = ({label, value, name, onChange, rows=2}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <textarea id={name} name={name} rows={rows} value={value} onChange={onChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-brand-primary"/>
    </div>
);

const SelectableCard: React.FC<{ title: string; description?: string; isSelected: boolean; onSelect: () => void; }> = ({ title, description, isSelected, onSelect }) => (
    <div 
        onClick={onSelect}
        className={`p-3 border-2 rounded-lg cursor-pointer transition-all h-full flex flex-col ${isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}
    >
        <div className="flex items-start">
            <input
                type="checkbox"
                readOnly
                checked={isSelected}
                className="mt-1 h-5 w-5 rounded text-brand-primary focus:ring-0"
                style={{ boxShadow: 'none' }}
            />
            <div className="ml-3">
                <p className="font-bold text-sm text-brand-text-primary">{title}</p>
                {description && <p className="text-xs text-brand-text-secondary mt-1">{description}</p>}
            </div>
        </div>
    </div>
);


export const DnaValidationStep: React.FC<BlueprintValidationStepProps> = ({ initialBlueprint, referenceImage, onStartCampaign, onBack }) => {
  const [step, setStep] = useState<'validate' | 'configure'>('validate');
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [blueprint, setBlueprint] = useState<CampaignBlueprint>(initialBlueprint);
  
  const [campaignOptions, setCampaignOptions] = useState<CampaignOptions | null>(null);

  const [selections, setSelections] = useState({
      personas: new Set<string>([initialBlueprint.targetPersona.description]),
      angles: new Set<string>(),
      hooks: new Set<string>(),
      formats: new Set<CreativeFormat>(),
  });
  
  const allPersonaOptions = useMemo(() => {
    if (!campaignOptions) return [blueprint.targetPersona];
    return [blueprint.targetPersona, ...campaignOptions.personaVariations];
  }, [blueprint.targetPersona, campaignOptions]);

  const allHookOptions = useMemo(() => campaignOptions?.buyingTriggers || [], [campaignOptions]);


  useEffect(() => {
    // Pre-select first 3 of each category once loaded
    if (campaignOptions) {
        setSelections(prev => ({
            ...prev,
            angles: new Set(campaignOptions.strategicAngles.slice(0, 3)),
            hooks: new Set(campaignOptions.buyingTriggers.map(h => h.name).slice(0, 3)),
            formats: new Set(ALL_CREATIVE_FORMATS.slice(0, 4)),
        }));
    }
  }, [campaignOptions]);


  const handleNextStep = async () => {
    setIsLoadingOptions(true);
    try {
        const options = await generateCampaignOptions(blueprint);
        setCampaignOptions(options);
        setStep('configure');
    } catch (e) {
        console.error("Gagal menghasilkan opsi kampanye", e);
        alert("Gagal menghasilkan opsi kampanye. Silakan coba lagi.");
    } finally {
        setIsLoadingOptions(false);
    }
  };
  
  const handleSelectionChange = (category: keyof typeof selections, value: string) => {
      setSelections(prev => {
          const newSet = new Set(prev[category]);
          if (newSet.has(value)) {
              // For personas, prevent unselecting the last one
              if (category === 'personas' && newSet.size === 1) {
                  return prev;
              }
              newSet.delete(value);
          } else {
              newSet.add(value);
          }
          return { ...prev, [category]: newSet };
      });
  };

  const totalConcepts = useMemo(() => {
    const combinations = selections.personas.size * selections.angles.size * selections.hooks.size * selections.formats.size;
    // Each combination will generate 3 variations (Emotional, Logical, Social)
    return combinations * 3;
  }, [selections]);

  const handleStart = () => {
    const selectedPersonas = allPersonaOptions.filter(p => selections.personas.has(p.description));
    const selectedAngles = campaignOptions ? campaignOptions.strategicAngles.filter(a => selections.angles.has(a)) : [];
    const selectedHooks = allHookOptions.filter(h => selections.hooks.has(h.name));
    const selectedFormats = ALL_CREATIVE_FORMATS.filter(f => selections.formats.has(f));

    if (selectedPersonas.length === 0 || selectedAngles.length === 0 || selectedHooks.length === 0 || selectedFormats.length === 0) {
        alert("Harap pilih setidaknya satu opsi dari setiap kategori untuk melanjutkan.");
        return;
    }
    onStartCampaign(blueprint, {
        personas: selectedPersonas,
        angles: selectedAngles,
        hooks: selectedHooks,
        formats: selectedFormats
    });
  };
  
  const handlePersonaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof TargetPersona) => {
      const { value } = e.target;
      const isArray = field === 'painPoints' || field === 'desiredOutcomes';
      setBlueprint(prev => ({
          ...prev,
          targetPersona: {
              ...prev.targetPersona,
              [field]: isArray ? value.split(',').map(s => s.trim()) : value
          }
      }));
  }

  const handleDnaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof CampaignBlueprint['adDna']) => {
      const { value } = e.target;
      const isArray = field === 'specificLanguagePatterns';
      setBlueprint(prev => ({
          ...prev,
          adDna: {
              ...prev.adDna,
              [field]: isArray ? value.split(',').map(s => s.trim()) : value
          }
      }));
  }

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof CampaignBlueprint['productAnalysis']) => {
    const { value } = e.target;
    setBlueprint(prev => ({
        ...prev,
        productAnalysis: {
            ...prev.productAnalysis,
            [field]: value
        }
    }));
  };
  
  if (step === 'configure') {
    return (
        <div className="w-full min-h-screen flex flex-col items-center p-4 md:p-8">
            <div className="text-center mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold">2. Bangun Matriks Kreatif Anda</h1>
                <p className="text-brand-text-secondary mt-2 text-lg">Pilih opsi yang dihasilkan AI untuk membangun kampanye pengujian Anda.</p>
            </div>

            <div className="w-full max-w-6xl mx-auto bg-brand-surface rounded-xl shadow-2xl p-6 space-y-6">
                {/* Personas Section */}
                <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-3">Langkah 1: Pilih Persona Target</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {allPersonaOptions.map((persona) => (
                            <SelectableCard
                                key={persona.description}
                                title={persona.description}
                                description={`${persona.age} | ${persona.creatorType}`}
                                isSelected={selections.personas.has(persona.description)}
                                onSelect={() => handleSelectionChange('personas', persona.description)}
                            />
                        ))}
                    </div>
                </div>

                {/* Angles Section */}
                <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-3">Langkah 2: Pilih Sudut Pandang Strategis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {campaignOptions?.strategicAngles.map((angle) => (
                             <SelectableCard
                                key={angle}
                                title={angle}
                                isSelected={selections.angles.has(angle)}
                                onSelect={() => handleSelectionChange('angles', angle)}
                            />
                        ))}
                    </div>
                </div>

                {/* Hooks Section */}
                <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-3">Langkah 3: Pilih Hook / Pemicu Psikologis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {allHookOptions.map((hook) => (
                             <SelectableCard
                                key={hook.name}
                                title={hook.name}
                                description={hook.example}
                                isSelected={selections.hooks.has(hook.name)}
                                onSelect={() => handleSelectionChange('hooks', hook.name)}
                            />
                        ))}
                    </div>
                </div>

                 {/* Formats Section */}
                <div>
                    <h3 className="text-xl font-semibold text-brand-primary mb-3">Langkah 4: Pilih Format Kreatif</h3>
                    <div className="flex flex-wrap gap-2">
                        {ALL_CREATIVE_FORMATS.map((format) => (
                            <button
                                key={format}
                                onClick={() => handleSelectionChange('formats', format)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${selections.formats.has(format) ? 'bg-brand-primary border-brand-primary text-white' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                            >
                                {format}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                    <button
                        onClick={handleStart}
                        className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:scale-[1.03] transition-transform transform flex items-center justify-center mx-auto disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                        disabled={totalConcepts === 0}
                    >
                        <RemixIcon className="w-5 h-5 mr-2" />
                        Hasilkan Matriks Kreatif ({totalConcepts} Varian Konsep)
                    </button>
                    <p className="text-xs text-brand-text-secondary mt-3">Total Konsep = (Persona × Sudut Pandang × Hook × Format) × 3 Varian</p>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6">
                <button onClick={() => setStep('validate')} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold">Kembali ke Validasi DNA</button>
            </div>
         </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        <div className="text-center mb-6 flex-shrink-0">
            <h1 className="text-3xl md:text-4xl font-extrabold">1. Validasi DNA Iklan</h1>
            <p className="text-brand-text-secondary mt-2 text-lg">Tinjau dan sempurnakan analisis strategis AI dari iklan referensi Anda.</p>
        </div>

        <div className="w-full max-w-7xl bg-brand-surface rounded-xl shadow-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="w-full aspect-square bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={`data:image/jpeg;base64,${referenceImage}`} alt="Iklan Referensi" className="max-h-full max-w-full object-contain rounded-md" />
              </div>
              <div>
                  <h3 className="text-lg font-semibold text-brand-primary border-b border-brand-primary/30 pb-1 mb-2">Produk</h3>
                   <div className="space-y-3">
                      <EditableField label="Nama Produk/Layanan" name="name" value={blueprint.productAnalysis.name} onChange={e => handleProductChange(e, 'name')} />
                      <EditableField label="Manfaat Utama" name="keyBenefit" value={blueprint.productAnalysis.keyBenefit} onChange={e => handleProductChange(e, 'keyBenefit')} />
                   </div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-brand-primary border-b border-brand-primary/30 pb-1 mb-2">Persona Target</h3>
                </div>
                <EditableTextarea label="Deskripsi Persona" name="description" value={blueprint.targetPersona.description} onChange={e => handlePersonaChange(e, 'description')} />
                <EditableField label="Rentang Usia" name="age" value={blueprint.targetPersona.age} onChange={e => handlePersonaChange(e, 'age')} />
                <EditableField label="Tipe Kreator" name="creatorType" value={blueprint.targetPersona.creatorType} onChange={e => handlePersonaChange(e, 'creatorType')} />
                <EditableTextarea label="Poin Masalah (pisahkan dengan koma)" name="painPoints" value={blueprint.targetPersona.painPoints.join(', ')} onChange={e => handlePersonaChange(e, 'painPoints')} />
                <EditableTextarea label="Hasil yang Diinginkan (pisahkan dengan koma)" name="desiredOutcomes" value={blueprint.targetPersona.desiredOutcomes.join(', ')} onChange={e => handlePersonaChange(e, 'desiredOutcomes')} />
                
                <div className="md:col-span-2 mt-2">
                    <h3 className="text-lg font-semibold text-brand-primary border-b border-brand-primary/30 pb-1 mb-2">Analisis Iklan (DNA Penjualan)</h3>
                </div>
                <EditableField label="Mekanisme Penjualan" name="salesMechanism" value={blueprint.adDna.salesMechanism} onChange={e => handleDnaChange(e, 'salesMechanism')} />
                <EditableField label="Formula Persuasi" name="persuasionFormula" value={blueprint.adDna.persuasionFormula} onChange={e => handleDnaChange(e, 'persuasionFormula')} />
                <EditableTextarea label="Pola Teks Iklan" name="copyPattern" value={blueprint.adDna.copyPattern} onChange={e => handleDnaChange(e, 'copyPattern')} />
                <EditableTextarea label="Pola Bahasa Spesifik (pisahkan dengan koma)" name="specificLanguagePatterns" value={blueprint.adDna.specificLanguagePatterns.join(', ')} onChange={e => handleDnaChange(e, 'specificLanguagePatterns')} />
                <EditableField label="Nada Suara" name="toneOfVoice" value={blueprint.adDna.toneOfVoice} onChange={e => handleDnaChange(e, 'toneOfVoice')} />
                <EditableField label="Elemen Bukti Sosial" name="socialProofElements" value={blueprint.adDna.socialProofElements} onChange={e => handleDnaChange(e, 'socialProofElements')} />
                <EditableTextarea label="Penanganan Keberatan" name="objectionHandling" value={blueprint.adDna.objectionHandling} onChange={e => handleDnaChange(e, 'objectionHandling')} />
                <EditableField label="Gaya Visual" name="visualStyle" value={blueprint.adDna.visualStyle} onChange={e => handleDnaChange(e, 'visualStyle')} />
                <EditableField label="Ringkasan Penawaran" name="offerSummary" value={blueprint.adDna.offerSummary} onChange={e => handleDnaChange(e, 'offerSummary')} />
                <EditableField label="Ajakan Bertindak (CTA)" name="cta" value={blueprint.adDna.cta} onChange={e => handleDnaChange(e, 'cta')} />
                <EditableField label="Negara Target" name="targetCountry" value={blueprint.adDna.targetCountry} onChange={e => handleDnaChange(e, 'targetCountry')} />
            </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <button
                onClick={handleNextStep}
                disabled={isLoadingOptions}
                className="w-full md:w-auto px-12 py-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-indigo-500 transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isLoadingOptions ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Membangun Opsi...
                    </>
                ) : (
                    'Berikutnya: Bangun Matriks Kreatif'
                )}
            </button>
            <button onClick={onBack} className="text-sm text-brand-text-secondary hover:text-white">Kembali ke Awal</button>
        </div>
    </div>
  );
}
