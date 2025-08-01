import React, { useState, useRef } from 'react';
import { X, Image, Video, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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

    // Validate file size
    if (isVideo && file.size > 300 * 1024 * 1024) { // 300MB
      setError('El video no puede superar los 300MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${stepId}-${Date.now()}.${fileExt}`;
      const filePath = `${teamId}/${featureId}/${stepId}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('step-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('step-media')
        .getPublicUrl(filePath);

      // Save media record in database
      const { error: dbError, data: mediaData } = await supabase
        .from('step_media')
        .insert({
          step_id: stepId,
          team_id: teamId,
          feature_id: featureId,
          type: isVideo ? 'video' : 'photo',
          url: publicUrl
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Notify parent component
      onUploadComplete({
        id: mediaData.id,
        type: mediaData.type,
        url: mediaData.url,
        createdAt: mediaData.created_at
      });

      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Error al subir el archivo');
    } finally {
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
                    Imágenes o videos (máx. 300MB)
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