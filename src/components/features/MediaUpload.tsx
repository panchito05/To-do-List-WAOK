import React, { useState, useRef } from 'react';
import { X, Image, Video, Loader2 } from 'lucide-react';
import { StepMedia } from '../../types';

interface MediaUploadProps {
  stepId: number;
  teamId: number;
  featureId: number;
  onUploadComplete: (media: StepMedia) => void;
  onClose: () => void;
}

export default function MediaUpload({ 
  stepId, 
  teamId, 
  featureId, 
  onUploadComplete, 
  onClose 
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      setError('Solo se permiten archivos de imagen o video');
      return;
    }

    // Validate file size (reduced for local storage)
    if (file.size > 50 * 1024 * 1024) { // 50MB limit for local storage
      setError('El archivo no puede superar los 50MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Convert file to data URL for local storage
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        
        // Create media object
        const media: StepMedia = {
          id: `media-${stepId}-${Date.now()}`,
          type: isVideo ? 'video' : 'photo',
          url: dataUrl,
          createdAt: new Date().toISOString()
        };

        onUploadComplete(media);
        setIsUploading(false);
        onClose();
      };

      reader.onerror = () => {
        setError('Error al procesar el archivo');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Error al procesar el archivo');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Subir Archivo
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
                  <p className="text-sm text-gray-600">Subiendo archivo...</p>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  <div className="flex items-center gap-2">
                    <Image size={24} className="text-gray-400" />
                    <Video size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Haz clic para seleccionar un archivo
                  </p>
                  <p className="text-xs text-gray-500">
                    Imágenes o videos (máx. 50MB)
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}