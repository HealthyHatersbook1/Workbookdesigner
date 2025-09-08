import React, { useState, useCallback } from 'react';
import { searchPexelsImages, PexelsPhoto } from '../services/pexelsService';
import { SearchIcon } from './icons';

interface StockImageSearchProps {
  onSelectImage: (url: string) => void;
}

const StockImageSearch: React.FC<StockImageSearchProps> = ({ onSelectImage }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<PexelsPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setImages([]);
    try {
      const results = await searchPexelsImages(query);
      if(results.length === 0){
          setError("No results found. Try a different search term.");
      }
      setImages(results);
    } catch (err) {
      setError('Failed to fetch images. Please check your API key.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImageClick = (photo: PexelsPhoto) => {
    // Use a high-quality but reasonably sized image
    onSelectImage(photo.src.large2x);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for photos..."
          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        />
        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700" disabled={isLoading}>
          <SearchIcon className="w-5 h-5" />
        </button>
      </form>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
        </div>
      )}
      
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          {images.map(photo => (
            <button key={photo.id} onClick={() => handleImageClick(photo)} className="aspect-square block rounded-md overflow-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <img 
                src={photo.src.tiny} 
                alt={photo.photographer} 
                className="w-full h-full object-cover transition-transform hover:scale-110"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockImageSearch;
