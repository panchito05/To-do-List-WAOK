import React, { useState, useEffect } from 'react';
import { Maximize2, MessageSquare, History, ChevronDown, ChevronRight, Edit2, Check, X, Minimize2, Trash2, Image } from 'lucide-react';
import { Feature, Step, VerificationStatus, GlobalVerification } from '../../types';
import StepList from './StepList';
import CommentSection from './CommentSection';
import VerificationHistory from './VerificationHistory';
import ConfirmationModal from '../ConfirmationModal';
import { useTeams } from '../../context/TeamsContext';

interface FeatureCardProps {
  feature: Feature;
  teamId: number;
  onUpdate: (feature: Feature) => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

export default function FeatureCard({ feature, teamId, onUpdate, onDelete, isReadOnly = false }: FeatureCardProps) {
  const { addGlobalVerification, teams } = useTeams();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(() => {
    // Recuperar el estado de expansión del localStorage al inicializar
    const savedState = localStorage.getItem(`feature-${feature.id}-expanded`);
    return savedState === 'true';
  });
  const [showHistory, setShowHistory] = useState(false);
  const [name, setName] = useState(feature.name);
  const [description, setDescription] = useState(feature.description || '');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Guardar el estado de expansión en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(`feature-${feature.id}-expanded`, isContentVisible.toString());
  }, [isContentVisible, feature.id]);

  // El resto del código permanece igual...
  const createGlobalVerification = (steps: Step[]) => {
    const globalVerification: GlobalVerification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      teamId,
      teamName: teams.find(t => t.id === teamId)?.name || 'Unknown Team',
      featureId: feature.id,
      featureNumber: feature.number,
      featureName: feature.name,
      steps: steps.map(step => ({
        id: step.id,
        number: step.number,
        description: step.description,
        status: step.status
      })),
      comments: [...feature.comments]
    };
    addGlobalVerification(globalVerification);
  };

  const getFeatureStatus = () => {
    if (feature.steps.length === 0) return 'default';
    const hasFailures = feature.steps.some(step => step.status === 'not_working');
    if (hasFailures) return 'failing';
    const allComplete = feature.steps.every(step => step.status === 'working');
    if (allComplete) return 'complete';
    const hasVerifications = feature.steps.some(step => step.status !== 'pending');
    if (hasVerifications) return 'in-progress';
    return 'default';
  };

  const getStatusStyles = () => {
    const status = getFeatureStatus();
    switch (status) {
      case 'failing':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
      case 'complete':
        return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
      case 'in-progress':
        return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-[rgb(var(--bg-primary))] border-[rgb(var(--border-primary))]';
    }
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      onUpdate({
        ...feature,
        name: name.trim(),
        description: description.trim() || undefined
      });
      setIsEditing(false);
    }
  };

  const handleStepsUpdate = (steps: Step[]) => {
    onUpdate({
      ...feature,
      steps
    });
  };

  const handleVerification = (stepId: number, status: VerificationStatus) => {
    const updatedSteps = feature.steps.map(step =>
      step.id === stepId ? { ...step, status, lastVerified: Date.now() } : step
    );

    onUpdate({
      ...feature,
      steps: updatedSteps
    });
  };

  const resetVerifications = () => {
    createGlobalVerification(feature.steps);

    const currentVerification = {
      id: Date.now(),
      timestamp: Date.now(),
      steps: feature.steps.map(step => ({
        stepId: step.id,
        status: step.status
      }))
    };

    const updatedSteps = feature.steps.map(step => ({
      ...step,
      status: 'pending' as VerificationStatus,
      lastVerified: undefined
    }));

    onUpdate({
      ...feature,
      steps: updatedSteps,
      verifications: [
        currentVerification,
        ...(feature.verifications || [])
      ].slice(0, 10),
      comments: []
    });
  };

  const handleUpdateComment = (commentId: number, newText: string) => {
    const updatedComments = feature.comments.map(comment =>
      comment.id === commentId ? { ...comment, text: newText } : comment
    );
    onUpdate({
      ...feature,
      comments: updatedComments
    });
  };

  const handleDeleteComment = (commentId: number) => {
    const updatedComments = feature.comments.filter(comment => comment.id !== commentId);
    onUpdate({
      ...feature,
      comments: updatedComments
    });
  };

  const getMediaCount = (steps: Step[]) => {
    return steps.reduce((count, step) => count + (step.media?.length || 0), 0);
  };

  if (isExpanded) {
    return (
      <div className="modal-overlay overflow-y-auto">
        <div className="w-full flex flex-col pb-8 sm:pb-0 sm:justify-center sm:p-4">
          <div className={`flex-1 sm:flex-initial sm:max-w-7xl sm:mx-auto w-full ${getStatusStyles()} rounded-t-xl sm:rounded-lg animate-slideUp`}>
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl font-semibold text-[rgb(var(--primary-600))]">#{feature.number}</span>
                  <div>
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-primary))] rounded-md focus:ring-2 focus:ring-[rgb(var(--primary-500))]"
                          placeholder="Nombre de la funcionalidad"
                          autoFocus
                        />
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-primary))] rounded-md focus:ring-2 focus:ring-[rgb(var(--primary-500))] min-h-[80px] resize-none"
                          placeholder="Descripción (opcional)"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleNameSubmit}
                            className="px-3 py-1 bg-[rgb(var(--success))] text-white rounded-md hover:bg-green-700"
                          >
                            <div className="flex items-center gap-2">
                              <Check size={16} />
                              <span>Guardar</span>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setName(feature.name);
                              setDescription(feature.description || '');
                            }}
                            className="px-3 py-1 bg-[rgb(var(--error))] text-white rounded-md hover:bg-red-700"
                          >
                            <div className="flex items-center gap-2">
                              <X size={16} />
                              <span>Cancelar</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))]">{feature.name}</h3>
                          {!isReadOnly && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--primary-600))] p-1 hover:bg-[rgb(var(--bg-secondary))] rounded-lg"
                              title="Editar funcionalidad"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {feature.comments.length > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-[rgb(var(--primary-50))] dark:bg-[rgb(var(--primary-900))]/20 rounded-full text-[rgb(var(--primary-600))]">
                              <MessageSquare size={16} />
                              <span className="text-sm font-medium">{feature.comments.length}</span>
                            </div>
                          )}
                        </div>
                        {feature.description && (
                          <p className="text-[rgb(var(--text-secondary))] mt-2">{feature.description}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] p-2 hover:bg-[rgb(var(--bg-secondary))] rounded-lg"
                    title="Minimizar"
                  >
                    <Minimize2 size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-8 overflow-visible">
                <StepList
                  steps={feature.steps}
                  onUpdate={handleStepsUpdate}
                  onVerify={handleVerification}
                  showVerification={!isReadOnly}
                />
                
                {showHistory && (
                  <VerificationHistory
                    verifications={feature.verifications || []}
                    onReset={resetVerifications}
                  />
                )}
                
                {!isReadOnly && <CommentSection
                  comments={feature.comments}
                  onAddComment={(text) => {
                    const newComment = {
                      id: Date.now(),
                      text,
                      author: 'Usuario',
                      timestamp: Date.now()
                    };
                    onUpdate({
                      ...feature,
                      comments: [...feature.comments, newComment]
                    });
                  }}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-sm border transition-colors ${getStatusStyles()}`}>
      <div 
        className="p-4 cursor-pointer"
        onClick={() => !isEditing && setIsContentVisible(!isContentVisible)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 flex-1">
            {!isEditing && (
              <div className="text-[rgb(var(--text-secondary))] transition-transform duration-200">
                {isContentVisible ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
            )}
            
            <div className="flex-1">
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-primary))] rounded-md focus:ring-2 focus:ring-[rgb(var(--primary-500))]"
                    placeholder="Nombre de la funcionalidad"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-primary))] rounded-md focus:ring-2 focus:ring-[rgb(var(--primary-500))] min-h-[80px] resize-none"
                    placeholder="Descripción (opcional)"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNameSubmit();
                      }}
                      className="px-3 py-1 bg-[rgb(var(--success))] text-white rounded-md hover:bg-green-700"
                    >
                      <div className="flex items-center gap-2">
                        <Check size={16} />
                        <span>Guardar</span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(false);
                        setName(feature.name);
                        setDescription(feature.description || '');
                      }}
                      className="px-3 py-1 bg-[rgb(var(--error))] text-white rounded-md hover:bg-red-700"
                    >
                      <div className="flex items-center gap-2">
                        <X size={16} />
                        <span>Cancelar</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-[rgb(var(--primary-600))]">#{feature.number}</span>
                    <h4 className="font-medium text-[rgb(var(--text-primary))]">{feature.name}</h4>
                    {!isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--primary-600))] p-1 hover:bg-[rgb(var(--bg-secondary))] rounded-lg"
                        title="Editar funcionalidad"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {getMediaCount(feature.steps) > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-600 dark:text-emerald-400">
                        <Image size={16} />
                        <span className="text-sm font-medium">{getMediaCount(feature.steps)}</span>
                      </div>
                    )}
                    {feature.comments.length > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[rgb(var(--primary-50))] dark:bg-[rgb(var(--primary-900))]/20 rounded-full text-[rgb(var(--primary-600))]">
                        <MessageSquare size={16} />
                        <span className="text-sm font-medium">{feature.comments.length}</span>
                      </div>
                    )}
                  </div>
                  {isContentVisible && feature.description && (
                    <p className="text-sm text-[rgb(var(--text-secondary))] mt-2">{feature.description}</p>
                  )}
                </div>
              )}
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-[rgb(var(--text-secondary))]">{feature.steps.length} pasos</span>
                {feature.steps.filter(s => s.status === 'working').length > 0 && (
                  <span className="text-[rgb(var(--success))]">
                    {feature.steps.filter(s => s.status === 'working').length} funcionando
                  </span>
                )}
                {feature.steps.filter(s => s.status === 'not_working').length > 0 && (
                  <span className="text-[rgb(var(--error))]">
                    {feature.steps.filter(s => s.status === 'not_working').length} no funcionando
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] p-2 hover:bg-[rgb(var(--bg-secondary))] rounded-lg"
              title="Historial de verificaciones"
            >
              <History size={20} />
            </button>
            {!isReadOnly && (
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                title="Eliminar funcionalidad"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] p-2 hover:bg-[rgb(var(--bg-secondary))] rounded-lg"
              title={isExpanded ? 'Minimizar' : 'Maximizar'}
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div 
        className={`transition-all duration-300 ease-in-out ${
          isContentVisible ? 'visible opacity-100' : 'invisible opacity-0 h-0'
        }`}
      >
        <div className="p-4 pt-0">
          <div className="space-y-4 overflow-visible">
            <StepList
              steps={feature.steps}
              onUpdate={handleStepsUpdate}
              onVerify={handleVerification}
              showVerification={!isReadOnly}
            />
            
            {showHistory && (
              <VerificationHistory
                verifications={feature.verifications || []}
                onReset={resetVerifications}
              />
            )}
            
            <CommentSection
              comments={feature.comments}
              onAddComment={(text) => {
                const newComment = {
                  id: Date.now(),
                  text,
                  author: 'Usuario',
                  timestamp: Date.now()
                };
                onUpdate({
                  ...feature,
                  comments: [...feature.comments, newComment]
                });
              }}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
            />
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={onDelete}
        title="Eliminar Funcionalidad"
        message={`¿Estás seguro de que deseas eliminar la funcionalidad "${feature.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  );
}