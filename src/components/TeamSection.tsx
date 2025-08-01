import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Edit2, Check, X, RefreshCw, Search, ChevronDown, GripVertical, Maximize2, Minimize2, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Team, Feature, VerificationStatus } from '../types';
import { useTeams } from '../context/TeamsContext';
import FeatureList from './features/FeatureList';
import ConfirmationModal from './ConfirmationModal';

interface TeamSectionProps {
  team: Team;
  onDuplicate: () => void;
  onDelete: () => void;
  onUpdateName: (teamId: number, newName: string) => void;
  onUpdateTeam: (teamId: number, updatedTeam: Team) => void;
  onTogglePin?: (teamId: number) => void;
  isReadOnly?: boolean;
}

export default function TeamSection({ team, onDuplicate, onDelete, onUpdateName, onUpdateTeam, onTogglePin, isReadOnly = false }: TeamSectionProps) {
  const { t } = useTranslation();
  const { addGlobalVerification } = useTeams();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(team.name);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    const savedState = localStorage.getItem(`team-${team.id}-expanded`);
    return savedState === null ? true : savedState === 'true';
  });

  useEffect(() => {
    localStorage.setItem(`team-${team.id}-expanded`, isExpanded.toString());
  }, [isExpanded, team.id]);

  // Manejar tecla Escape para cerrar vista expandida
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando está en pantalla completa
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Mantener los números originales al filtrar
  const filteredFeatures = team.features
    .map((feature, index) => ({
      ...feature,
      originalNumber: index + 1 // Guardar el número original
    }))
    .filter(feature => {
      const query = searchQuery.toLowerCase();
      return (
        feature.name.toLowerCase().includes(query) ||
        feature.description?.toLowerCase().includes(query) ||
        feature.steps.some(step => step.description.toLowerCase().includes(query)) ||
        feature.comments.some(comment => comment.text.toLowerCase().includes(query))
      );
    });

  const handleNameSubmit = () => {
    if (editedName.trim()) {
      onUpdateName(team.id, editedName);
      setIsEditing(false);
    }
  };

  const addFeature = () => {
    const newFeature: Feature = {
      id: Date.now(),
      number: (team.features?.length || 0) + 1,
      name: `Nueva Funcionalidad ${(team.features?.length || 0) + 1}`,
      steps: [],
      comments: [],
      verifications: []
    };
    const updatedFeatures = [...(team.features || []), newFeature];
    onUpdateTeam(team.id, { ...team, features: updatedFeatures });
  };

  const updateFeature = (teamId: number, updatedFeature: Feature) => {
    const updatedFeatures = team.features.map(f =>
      f.id === updatedFeature.id ? updatedFeature : f
    );
    onUpdateTeam(teamId, { ...team, features: updatedFeatures });
  };

  const deleteFeature = (featureId: number) => {
    const updatedFeatures = team.features
      .filter(f => f.id !== featureId)
      .map((feature, index) => ({
        ...feature,
        number: index + 1
      }));
    onUpdateTeam(team.id, { ...team, features: updatedFeatures });
  };

  const reorderFeatures = (fromIndex: number, toIndex: number) => {
    const updatedFeatures = [...team.features];
    const [movedFeature] = updatedFeatures.splice(fromIndex, 1);
    updatedFeatures.splice(toIndex, 0, movedFeature);

    const reorderedFeatures = updatedFeatures.map((feature, index) => ({
      ...feature,
      number: index + 1
    }));

    onUpdateTeam(team.id, { ...team, features: reorderedFeatures });
  };

  const handleResetAll = async () => {
    const resetTimestamp = Date.now();
    
    for (const feature of team.features) {
      const globalVerification = {
        id: `${resetTimestamp}-${feature.number}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: resetTimestamp,
        teamId: team.id,
        teamName: team.name,
        featureId: feature.id,
        featureNumber: feature.number,
        featureName: feature.name,
        steps: feature.steps.map(step => ({
          id: step.id,
          number: step.number,
          description: step.description,
          status: step.status
        })),
        comments: [...feature.comments]
      };
      
      await addGlobalVerification(globalVerification);
    }

    const updatedFeatures = team.features.map(feature => {
      const currentVerification = {
        id: resetTimestamp,
        timestamp: resetTimestamp,
        steps: feature.steps.map(step => ({
          stepId: step.id,
          status: step.status
        }))
      };

      return {
        ...feature,
        steps: feature.steps.map(step => ({
          ...step,
          status: 'pending' as VerificationStatus,
          lastVerified: undefined
        })),
        verifications: [
          currentVerification,
          ...(feature.verifications || [])
        ].slice(0, 10),
        comments: []
      };
    });

    onUpdateTeam(team.id, { ...team, features: updatedFeatures });
    setShowResetConfirmation(false);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 overflow-hidden">
        <div className="h-screen w-full flex flex-col">
          <div className="bg-[rgb(var(--bg-primary))] flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold text-[rgb(var(--primary-600))]">#{team.id}</span>
                  <div className="flex-1 pr-16">
                    {isEditing ? (
                      <div className="relative z-20 bg-[rgb(var(--bg-primary))] rounded-lg p-4 shadow-lg border border-[rgb(var(--border-primary))]">
                        <div className="flex flex-col gap-4">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="w-full px-4 py-3 text-2xl font-bold bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-primary))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500))] text-center"
                            autoFocus
                          />
                          <div className="flex items-center gap-3 justify-center">
                            <button
                              onClick={handleNameSubmit}
                              className="flex items-center gap-2 px-6 py-3 bg-[rgb(var(--success))] text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm min-w-[120px] justify-center"
                              title="Guardar"
                            >
                              <Check size={20} />
                              <span className="font-medium">Guardar</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setEditedName(team.name);
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-[rgb(var(--error))] text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm min-w-[120px] justify-center"
                              title="Cancelar"
                            >
                              <X size={20} />
                              <span className="font-medium">Cancelar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))]">{team.name}</h3>
                        {!isReadOnly && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--primary-600))] p-1 hover:bg-[rgb(var(--bg-secondary))] rounded-lg"
                            title="Editar nombre"
                          >
                            <Edit2 size={20} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] p-2 hover:bg-[rgb(var(--bg-secondary))] rounded-lg"
                  title="Minimizar"
                >
                  <Minimize2 size={24} />
                </button>
              </div>
              
              {!isReadOnly && <div className="relative mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar funcionalidades, pasos o comentarios..."
                  className="w-full pl-10 pr-4 py-2 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary-500))]"
                />
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="px-2 py-1 bg-[rgb(var(--primary-100))] text-[rgb(var(--primary-700))] rounded-full text-sm">
                      {filteredFeatures.length} {filteredFeatures.length === 1 ? 'resultado' : 'resultados'}
                    </span>
                  </div>
                )}
              </div>}
              
              <FeatureList
                features={filteredFeatures}
                teamId={team.id}
                onAddFeature={addFeature}
                onUpdateFeature={updateFeature}
                onReorderFeatures={reorderFeatures}
                onDeleteFeature={deleteFeature}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card relative ${team.isPinned ? 'ring-2 ring-[rgb(var(--primary-500))]' : ''}`}>
      {/* BOTONES ESQUINA SUPERIOR DERECHA */}
      <div className={`absolute top-4 right-4 flex items-center gap-2 transition-all duration-200 ${
        isEditing ? 'z-0 opacity-50' : 'z-10 opacity-100'
      }`}>
        {onTogglePin && (
          <button
            onClick={() => onTogglePin(team.id)}
            className={`p-2 rounded-lg transition-colors shadow-md ${
              team.isPinned 
                ? 'bg-[rgb(var(--primary-600))] text-white hover:bg-[rgb(var(--primary-700))]' 
                : 'bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] hover:text-[rgb(var(--text-primary))]'
            }`}
            title={team.isPinned ? 'Desfijar' : 'Fijar'}
          >
            <Pin size={20} className={team.isPinned ? 'fill-current' : ''} />
          </button>
        )}
        {!isReadOnly && (
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1 text-white bg-[rgb(var(--success))] hover:bg-green-600 p-2 rounded-lg shadow-md transition-colors"
            title="Expandir"
          >
            <Maximize2 size={20} />
          </button>
        )}
      </div>
      
      <div className="p-4">
        {/* NOMBRE DEL EQUIPO - SOLO ARRIBA */}
        <div className={`mb-4 transition-all duration-200 ${isEditing ? 'pr-2' : 'pr-24'}`}>
          {isEditing ? (
            <div className="relative z-20 bg-[rgb(var(--bg-primary))] rounded-lg p-3 shadow-lg border border-[rgb(var(--border-primary))]">
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 text-xl font-semibold bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-primary))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500))] text-center"
                  autoFocus
                />
                <div className="flex items-center gap-2 justify-center">
                  <button
                    onClick={handleNameSubmit}
                    className="flex items-center gap-1 px-4 py-2 bg-[rgb(var(--success))] text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm min-w-[100px] justify-center"
                    title="Guardar"
                  >
                    <Check size={16} />
                    <span className="text-sm font-medium">Guardar</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedName(team.name);
                    }}
                    className="flex items-center gap-1 px-4 py-2 bg-[rgb(var(--error))] text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm min-w-[100px] justify-center"
                    title="Cancelar"
                  >
                    <X size={16} />
                    <span className="text-sm font-medium">Cancelar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] text-center">{team.name}</h3>
          )}
        </div>

        {/* BOTONES DE CONTROL - HORIZONTAL DEBAJO DEL NOMBRE */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 flex items-center justify-center cursor-move bg-[rgb(var(--bg-secondary))] hover:bg-[rgb(var(--bg-tertiary))] rounded-lg transition-colors"
              title="Arrastrar para reordenar"
            >
              <GripVertical size={20} className="text-[rgb(var(--text-secondary))]" />
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 hover:bg-[rgb(var(--bg-secondary))] rounded-lg transition-all duration-200 transform ${
                isReadOnly ? 'cursor-default' : ''
              }`}
              disabled={isReadOnly}
            >
              <ChevronDown
                size={20}
                className={`text-[rgb(var(--text-secondary))] transition-transform duration-200 ${
                  isExpanded ? 'transform rotate-0' : 'transform -rotate-90'
                }`}
              />
            </button>
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="text-[rgb(var(--error))] hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Eliminar equipo"
            >
              <Trash2 size={20} />
            </button>
          </div>
          
          {!isReadOnly && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setShowResetConfirmation(true)}
                className="btn-ghost touch-target-sm"
                title="Reiniciar todas las verificaciones"
              >
                <RefreshCw size={20} />
                <span className="hidden lg:inline">Reiniciar</span>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-ghost touch-target-sm"
                title="Editar nombre"
              >
                <Edit2 size={20} />
                <span className="hidden lg:inline">Editar</span>
              </button>
              <button
                onClick={onDuplicate}
                className="btn-ghost touch-target-sm text-[rgb(var(--primary-600))] hover:text-[rgb(var(--primary-700))]"
                title="Duplicar equipo"
              >
                <Copy size={20} />
                <span className="hidden lg:inline">Duplicar</span>
              </button>
            </div>
          )}
        </div>

        {/* BARRA DE BÚSQUEDA */}
        {!isReadOnly && (
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar funcionalidades, pasos o comentarios..."
              className="w-full pl-10 pr-4 py-3 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary-500))] focus:border-transparent transition-all"
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-fadeIn">
                <span className="px-2 py-1 bg-[rgb(var(--primary-100))] text-[rgb(var(--primary-700))] rounded-full text-sm font-medium">
                  {filteredFeatures.length} {filteredFeatures.length === 1 ? 'resultado' : 'resultados'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO DE LAS FUNCIONALIDADES */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <FeatureList
            features={filteredFeatures}
            teamId={team.id}
            onAddFeature={addFeature}
            onUpdateFeature={updateFeature}
            onReorderFeatures={reorderFeatures}
            onDeleteFeature={deleteFeature}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={onDelete}
        title="Eliminar Equipo"
        message={`¿Estás seguro de que deseas eliminar el equipo "${team.name}"? Esta acción moverá el equipo a la papelera de reciclaje.`}
        confirmText="Eliminar"
      />

      <ConfirmationModal
        isOpen={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        onConfirm={handleResetAll}
        title="Reiniciar Todas las Verificaciones"
        message={`¿Estás seguro de que deseas reiniciar todas las verificaciones del equipo "${team.name}"? Esta acción guardará el estado actual en el historial y reiniciará todos los pasos a pendiente.`}
        confirmText="Reiniciar"
      />
    </div>
  );
}