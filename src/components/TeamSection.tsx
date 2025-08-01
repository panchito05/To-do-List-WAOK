import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Edit2, Check, X, Plus, RefreshCw, Search, ChevronDown, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
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
  isReadOnly?: boolean;
}

export default function TeamSection({ team, onDuplicate, onDelete, onUpdateName, onUpdateTeam, isReadOnly = false }: TeamSectionProps) {
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
      <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
        <div className="min-h-screen w-full flex flex-col pb-8">
          <div className="bg-white flex-1">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold text-indigo-600">#{team.id}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{team.name}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
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
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
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
    <div className="bg-white rounded-lg shadow-md transition-all hover:shadow-lg border-4 border-black relative">
      {/* BOTÓN EXPANDIR - ESQUINA SUPERIOR DERECHA */}
      {!isReadOnly && (
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 z-10 flex items-center gap-1 text-white bg-green-500 hover:bg-green-600 p-2 rounded-lg shadow-md transition-colors"
          title="Expandir"
        >
          <Maximize2 size={20} />
        </button>
      )}
      
      <div className="p-4">
        {/* NOMBRE DEL EQUIPO - SOLO ARRIBA */}
        <div className="mb-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 px-3 py-2 text-xl font-semibold border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                onClick={handleNameSubmit}
                className="text-green-600 hover:text-green-700 p-2"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedName(team.name);
                }}
                className="text-red-600 hover:text-red-700 p-2"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <h3 className="text-xl font-semibold text-gray-800">{team.name}</h3>
          )}
        </div>

        {/* BOTONES DE CONTROL - HORIZONTAL DEBAJO DEL NOMBRE */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 flex items-center justify-center cursor-move bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Arrastrar para reordenar"
            >
              <GripVertical size={20} className="text-gray-600" />
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 transform ${
                isReadOnly ? 'cursor-default' : ''
              }`}
              disabled={isReadOnly}
            >
              <ChevronDown
                size={20}
                className={`text-gray-500 transition-transform duration-200 ${
                  isExpanded ? 'transform rotate-0' : 'transform -rotate-90'
                }`}
              />
            </button>
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
              title="Eliminar equipo"
            >
              <Trash2 size={20} />
            </button>
          </div>
          
          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetConfirmation(true)}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg text-sm"
                title="Reiniciar todas las verificaciones"
              >
                <RefreshCw size={20} />
                <span className="hidden lg:inline">Reiniciar</span>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg text-sm"
                title="Editar nombre"
              >
                <Edit2 size={20} />
                <span className="hidden lg:inline">Editar</span>
              </button>
              <button
                onClick={onDuplicate}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg text-sm"
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
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
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