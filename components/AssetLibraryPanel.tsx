import React from 'react';
import type { Asset, WorkbookElement } from '../types';

interface AssetLibraryPanelProps {
  assets: Asset[];
  onAssetClick: (asset: Asset) => void;
  selectedElement: WorkbookElement | null;
}

const AssetLibraryPanel: React.FC<AssetLibraryPanelProps> = ({ assets, onAssetClick, selectedElement }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, asset: Asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const isImageSelected = selectedElement?.type === 'image';

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold text-slate-800">Asset Library</h3>
        <p className="text-sm text-slate-500 mt-1">
          {isImageSelected
            ? 'Click an asset to replace the selected image.'
            : 'Drag an asset onto the canvas to add it.'}
        </p>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {assets.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            <p>Your library is empty.</p>
            <p className="text-sm">Images you upload or find will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {assets.map(asset => (
              <div
                key={asset.id}
                className={`aspect-square bg-slate-200 rounded-md overflow-hidden cursor-pointer group relative ${isImageSelected ? 'hover:ring-2 hover:ring-indigo-500' : 'cursor-grab'}`}
                onClick={() => onAssetClick(asset)}
                draggable={!isImageSelected}
                onDragStart={e => handleDragStart(e, asset)}
              >
                <img
                  src={asset.url}
                  alt="Asset"
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  onDragStart={e => e.preventDefault()}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetLibraryPanel;
