import React from 'react';
import { ZoomInIcon, ZoomOutIcon, LocateIcon } from './icons';

interface CanvasControlsProps {
  // In a real app, these would be function props for zooming and panning
}

export const CanvasControls: React.FC<CanvasControlsProps> = () => {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
      <button className="bg-brand-surface/80 backdrop-blur-md border border-gray-700 rounded-lg p-2 shadow-lg hover:bg-gray-700 transition-colors" title="Zoom In">
        <ZoomInIcon className="w-5 h-5" />
      </button>
      <button className="bg-brand-surface/80 backdrop-blur-md border border-gray-700 rounded-lg p-2 shadow-lg hover:bg-gray-700 transition-colors" title="Zoom Out">
        <ZoomOutIcon className="w-5 h-5" />
      </button>
      <button className="bg-brand-surface/80 backdrop-blur-md border border-gray-700 rounded-lg p-2 shadow-lg hover:bg-gray-700 transition-colors" title="Fit to View">
        <LocateIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
