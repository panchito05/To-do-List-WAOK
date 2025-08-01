import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, Plus, Trash2, CheckCircle, XCircle, Edit2, Check, X, ListPlus, Paperclip, Image, Video, MoreVertical, Download, Loader2 } from 'lucide-react';
import { Step, VerificationStatus, StepMedia } from '../../types';
import ConfirmationModal from '../ConfirmationModal';
import MediaViewer from '../MediaViewer';
import MediaUpload from './MediaUpload';
import { supabase } from '../../lib/supabase';

interface StepListProps {
  steps: Step[];
  onUpdate: (steps: Step[]) => void;
  onVerify?: (stepId: number, status: VerificationStatus) => void;
  showVerification?: boolean;
}

function StepList({ steps, onUpdate, onVerify, showVerification = true }: StepListProps) {
  const { t } = useTranslation();
  const [newStep, setNewStep] = useState('');
  const [stepToDelete, setStepToDelete] = useState<Step | null>(null);
  const [draggedStep, setDraggedStep] = useState<Step | null>(null);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMediaUpload, setShowMediaUpload] = useState<number | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<{
    stepId: number;
    mediaItems: {url: string; type: 'photo' | 'video'; id: string}[];
    currentIndex: number;
  } | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<{ stepId: number; mediaId: string } | null>(null);
  const [mediaOptionsOpen, setMediaOptionsOpen] = useState<string | null>(null);
  const [downloadingMedia, setDownloadingMedia] = useState<string | null>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (editingStepId) {
      adjustTextareaHeight();
    }
  }, [editingStepId, editingText]);

  // Cerrar el menú de opciones cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mediaOptionsOpen && !(event.target as Element).closest('.media-options-menu')) {
        setMediaOptionsOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mediaOptionsOpen]);

  const addStep = () => {
    if (newStep.trim()) {
      const step: Step = {
        id: Date.now(),
        number: (steps.length + 1),
        description: newStep.trim(),
        order: steps.length,
        status: 'pending'
      };
      onUpdate([...steps, step]);
      setNewStep('');
    }
  };

  const removeStep = (stepId: number) => {
    const updatedSteps = steps
      .filter(s => s.id !== stepId)
      .map((step, index) => ({
        ...step,
        number: index + 1,
        order: index
      }));
    onUpdate(updatedSteps);
  };

  const reorderSteps = (draggedStep: Step, targetStep: Step) => {
    const draggedIndex = steps.findIndex(s => s.id === draggedStep.id);
    const targetIndex = steps.findIndex(s => s.id === targetStep.id);
    
    if (draggedIndex === targetIndex) return;

    const newSteps = [...steps];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      number: index + 1,
      order: index
    }));

    onUpdate(updatedSteps);
  };

  const handleEdit = (step: Step) => {
    setEditingStepId(step.id);
    setEditingText(step.description);
  };

  const handleUpdate = () => {
    if (editingStepId && editingText.trim()) {
      const updatedSteps = steps.map(step =>
        step.id === editingStepId
          ? { ...step, description: editingText.trim() }
          : step
      );
      onUpdate(updatedSteps);
      setEditingStepId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setEditingText('');
  };

  const handleVerify = (stepId: number, newStatus: VerificationStatus) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      const status = step.status === newStatus ? 'pending' : newStatus;
      onVerify?.(stepId, status);
    }
  };

  const handleMediaUploadComplete = async (stepId: number, media: StepMedia) => {
    const updatedSteps = steps.map(step =>
      step.id === stepId ? {
        ...step,
        media: [...(step.media || []), media]
      } : step
    );
    onUpdate(updatedSteps);
  };

  const handleDeleteMedia = async (stepId: number, mediaId: string) => {
    try {
      // Encuentra el paso y el medio específico
      const step = steps.find(s => s.id === stepId);
      if (!step || !step.media) return;
      
      const mediaItem = step.media.find(m => m.id === mediaId);
      if (!mediaItem) return;

      // Intenta eliminar del storage (si es posible)
      try {
        const filePathParts = mediaItem.url.split('/');
        const fileName = filePathParts[filePathParts.length - 1];
        const filePath = `${stepId}/${fileName}`;
        
        await supabase.storage
          .from('step-media')
          .remove([filePath]);
      } catch (storageError) {
        console.error('Error eliminando archivo de storage:', storageError);
        // Continuar incluso si hay error en storage
      }

      // Eliminar de la base de datos
      await supabase
        .from('step_media')
        .delete()
        .eq('id', mediaId);

      // Actualizar estado local
      const updatedSteps = steps.map(step =>
        step.id === stepId ? {
          ...step,
          media: (step.media || []).filter(m => m.id !== mediaId)
        } : step
      );
      onUpdate(updatedSteps);
      
      // Si estamos visualizando este medio, cerramos el visor
      if (expandedMedia && expandedMedia.stepId === stepId) {
        // Si solo hay un medio, cerramos el visor
        if (expandedMedia.mediaItems.length <= 1) {
          setExpandedMedia(null);
        } else {
          // Si hay más medios, actualizamos la lista
          const updatedMediaItems = expandedMedia.mediaItems.filter(item => item.id !== mediaId);
          const newIndex = Math.min(expandedMedia.currentIndex, updatedMediaItems.length - 1);
          
          if (updatedMediaItems.length === 0) {
            setExpandedMedia(null);
          } else {
            setExpandedMedia({
              ...expandedMedia,
              mediaItems: updatedMediaItems,
              currentIndex: newIndex
            });
          }
        }
      }
    } catch (error) {
      console.error('Error eliminando medio:', error);
    }
  };

  const handleOpenMedia = (stepId: number, mediaId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step || !step.media || step.media.length === 0) return;
    
    const mediaItems = step.media.map(media => ({
      url: media.url,
      type: media.type,
      id: media.id
    }));
    
    const currentIndex = step.media.findIndex(m => m.id === mediaId);
    
    setExpandedMedia({
      stepId,
      mediaItems,
      currentIndex: currentIndex >= 0 ? currentIndex : 0
    });
  };

  const handleDirectDownload = async (media: StepMedia) => {
    try {
      setDownloadingMedia(media.id);
      
      // Obtener el nombre del archivo de la URL
      const urlParts = media.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Usar fetch para obtener el archivo como blob
      const response = await fetch(media.url);
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
      
      // Cerrar el menú de opciones
      setMediaOptionsOpen(null);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert('Error al descargar el archivo. Por favor, inténtalo de nuevo.');
    } finally {
      setDownloadingMedia(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-gray-800">{t('common.steps')}</h5>
        {showVerification && (
          <button
            onClick={() => setNewStep('')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-50"
          >
            <ListPlus size={20} />
            <span>{t('actions.addStep')}</span>
          </button>
        )}
      </div>
      
      <div className="space-y-2 overflow-y-auto">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-2 p-2 rounded-md transition-colors bg-gray-50 hover:bg-gray-100
              ${step.status === 'working' 
                ? 'border-4 border-green-500' 
                : step.status === 'not_working' 
                  ? 'border-4 border-red-500' 
                  : 'border-4 border-black'
              }`}
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              setDraggedStep(step);
              e.currentTarget.classList.add('opacity-50');
            }}
            onDragEnd={(e) => {
              e.stopPropagation();
              setDraggedStep(null);
              e.currentTarget.classList.remove('opacity-50');
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.add('bg-indigo-50');
            }}
            onDragLeave={(e) => {
              e.stopPropagation();
              e.currentTarget.classList.remove('bg-indigo-50');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.remove('bg-indigo-50');
              if (draggedStep && draggedStep.id !== step.id) {
                reorderSteps(draggedStep, step);
              }
            }}
          >
            <div 
              className="cursor-move p-1 hover:bg-gray-200 rounded"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical size={20} className="text-gray-400" />
            </div>
            
            <div className="flex-1">
              <span className="font-medium text-indigo-600 mr-2">#{step.number}</span>
              {editingStepId === step.id ? (
                <textarea
                  ref={textareaRef}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                  autoFocus
                />
              ) : (
                <div className="flex items-start gap-2">
                  <span className="flex-1 whitespace-pre-wrap">{step.description}</span>
                </div>
              )}

              {/* Media Gallery */}
              {step.media && step.media.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {step.media.map(media => (
                    <div 
                      key={media.id}
                      className="relative group"
                    >
                      {media.type === 'photo' ? (
                        <div className="relative">
                          <img
                            src={media.url}
                            onClick={() => handleOpenMedia(step.id, media.id)}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaOptionsOpen(mediaOptionsOpen === media.id ? null : media.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {mediaOptionsOpen === media.id && (
                            <div className="media-options-menu absolute right-0 top-8 z-10 w-40 bg-white rounded-lg shadow-lg overflow-hidden">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMedia(step.id, media.id);
                                    setMediaOptionsOpen(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Image size={16} />
                                  <span>Ver imagen</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectDownload(media);
                                  }}
                                  disabled={downloadingMedia === media.id}
                                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  {downloadingMedia === media.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Download size={16} />
                                  )}
                                  <span>{downloadingMedia === media.id ? 'Descargando...' : 'Descargar'}</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMediaToDelete({ stepId: step.id, mediaId: media.id });
                                    setMediaOptionsOpen(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 size={16} />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <video
                            src={media.url}
                            onClick={() => handleOpenMedia(step.id, media.id)}
                            className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaOptionsOpen(mediaOptionsOpen === media.id ? null : media.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {mediaOptionsOpen === media.id && (
                            <div className="media-options-menu absolute right-0 top-8 z-10 w-40 bg-white rounded-lg shadow-lg overflow-hidden">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMedia(step.id, media.id);
                                    setMediaOptionsOpen(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Video size={16} />
                                  <span>Ver video</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectDownload(media);
                                  }}
                                  disabled={downloadingMedia === media.id}
                                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  {downloadingMedia === media.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Download size={16} />
                                  )}
                                  <span>{downloadingMedia === media.id ? 'Descargando...' : 'Descargar'}</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMediaToDelete({ stepId: step.id, mediaId: media.id });
                                    setMediaOptionsOpen(null);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 size={16} />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {showVerification && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVerify(step.id, 'working')}
                    className={`p-2 rounded-lg transition-colors ${
                      step.status === 'working'
                        ? 'bg-black/20'
                        : 'hover:bg-green-100'
                    }`}
                    title={step.status === 'working' ? t('actions.unmark') : t('actions.markAsWorking')}
                  >
                    <CheckCircle size={22} className="text-green-500" />
                  </button>
                  <button
                    onClick={() => handleVerify(step.id, 'not_working')}
                    className={`p-2 rounded-lg transition-colors ${
                      step.status === 'not_working'
                        ? 'bg-black/20'
                        : 'hover:bg-red-100'
                    }`}
                    title={step.status === 'not_working' ? t('actions.unmark') : t('actions.markAsNotWorking')}
                  >
                    <XCircle size={22} className="text-red-500" />
                  </button>
                </div>

                {editingStepId === step.id ? (
                  // Botones de confirmación y cancelación en modo edición
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUpdate}
                      className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg"
                      title={t('common.save')}
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                      title={t('common.cancel')}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  // Botones normales
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(step)}
                      className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg"
                      title={t('actions.editStep')}
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => setStepToDelete(step)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                      title={t('actions.deleteStep')}
                    >
                      <Trash2 size={20} />
                    </button>
                    <button
                      onClick={() => setShowMediaUpload(step.id)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                      title="Adjuntar archivo"
                    >
                      <Paperclip size={20} className="text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {showVerification && newStep !== null && (
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            placeholder={t('messages.stepPlaceholder')}
            className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            onKeyPress={(e) => e.key === 'Enter' && addStep()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={addStep}
              disabled={!newStep.trim()}
              className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setNewStep('')}
              className="bg-gray-200 text-gray-600 p-2 rounded-md hover:bg-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={stepToDelete !== null}
        onClose={() => setStepToDelete(null)}
        onConfirm={() => {
          if (stepToDelete) {
            removeStep(stepToDelete.id);
            setStepToDelete(null);
          }
        }}
        title={t('modals.deleteStep.title')}
        message={t('modals.deleteStep.message', { step: stepToDelete?.description })}
        confirmText={t('common.delete')}
      />
      
      <ConfirmationModal
        isOpen={mediaToDelete !== null}
        onClose={() => setMediaToDelete(null)}
        onConfirm={() => {
          if (mediaToDelete) {
            handleDeleteMedia(mediaToDelete.stepId, mediaToDelete.mediaId);
            setMediaToDelete(null);
          }
        }}
        title="Eliminar archivo"
        message="¿Está seguro que desea eliminar este archivo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
      
      {showMediaUpload !== null && (
        <MediaUpload
          stepId={showMediaUpload}
          teamId={steps[0]?.id || 0} // Assuming all steps belong to the same team
          featureId={steps[0]?.id || 0} // Assuming all steps belong to the same feature
          onUploadComplete={(media) => handleMediaUploadComplete(showMediaUpload, media)}
          onClose={() => setShowMediaUpload(null)}
        />
      )}
      
      {expandedMedia && (
        <MediaViewer
          mediaItems={expandedMedia.mediaItems}
          currentIndex={expandedMedia.currentIndex}
          onClose={() => setExpandedMedia(null)}
          onDelete={(mediaId) => {
            handleDeleteMedia(expandedMedia.stepId, mediaId);
            setExpandedMedia(null);
          }}
          onNavigate={(newIndex) => {
            setExpandedMedia({
              ...expandedMedia,
              currentIndex: newIndex
            });
          }}
        />
      )}
    </div>
  );
}

export default StepList;