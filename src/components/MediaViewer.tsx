import React, { useState, useRef } from 'react';
import { X, MoreVertical, Trash2, ExternalLink, Download, Maximize, Minimize, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface MediaItem {
  url: string;
  type: 'photo' | 'video';
  id: string;
}

interface MediaViewerProps {
  mediaItems: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onDelete?: (mediaId: string) => void;
  onNavigate: (newIndex: number) => void;
}

export default function MediaViewer({ mediaItems, currentIndex, onClose, onDelete, onNavigate }: MediaViewerProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentMedia = mediaItems[currentIndex];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error('Error attempting to exit fullscreen:', err);
        });
      }
    }
  };

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % mediaItems.length;
    onNavigate(nextIndex);
  };

  const goToPrevious = () => {
    const prevIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
    onNavigate(prevIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const downloadMedia = async () => {
    try {
      setIsDownloading(true);
      
      // Obtener el nombre del archivo de la URL
      const urlParts = currentMedia.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Usar fetch para obtener el archivo como blob
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      
      // Crear un objeto URL para el blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear un elemento de enlace temporal
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      
      // Simular clic para iniciar la descarga
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setShowOptions(false);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert('Error al descargar el archivo. Por favor, inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full hover:bg-black/20"
      >
        <X size={24} />
      </button>
      
      {/* Navigation buttons */}
      {mediaItems.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-2 rounded-full hover:bg-black/20"
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-2 rounded-full hover:bg-black/20"
            aria-label="Siguiente"
          >
            <ChevronRight size={36} />
          </button>
        </>
      )}
      
      <div className="relative max-w-[90vw] max-h-[90vh]">
        {currentMedia.type === 'photo' ? (
          <img
            src={currentMedia.url}
            alt=""
            className="max-w-full max-h-[90vh] object-contain"
          />
        ) : (
          <video
            src={currentMedia.url}
            controls
            className="max-w-full max-h-[90vh]"
            autoPlay
          />
        )}

        {/* Media counter */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full">
            {currentIndex + 1} / {mediaItems.length}
          </div>
        )}

        <div className="absolute top-2 right-2 z-10">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
          >
            <MoreVertical size={20} />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="py-1">
                <a
                  href={currentMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <ExternalLink size={16} />
                  <span>Abrir en nueva pestaña</span>
                </a>
                <button
                  onClick={downloadMedia}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  {isDownloading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  <span>{isDownloading ? 'Descargando...' : 'Descargar'}</span>
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  <span>{isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}</span>
                </button>
                {onDelete && (
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 size={16} />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={() => {
          if (onDelete) onDelete(currentMedia.id);
          setShowDeleteConfirmation(false);
        }}
        title="Eliminar archivo"
        message="¿Está seguro que desea eliminar este archivo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
}