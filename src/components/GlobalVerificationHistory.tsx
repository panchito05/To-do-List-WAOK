import React, { useState, useMemo } from 'react';
import { X, Calendar, CheckCircle2, XCircle, Clock, Search, MessageSquare } from 'lucide-react';
import { VerificationStatus, GlobalVerification } from '../types';
import { useTeams } from '../context/TeamsContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface GlobalVerificationHistoryProps {
  onClose: () => void;
}

export default function GlobalVerificationHistory({ onClose }: GlobalVerificationHistoryProps) {
  const { globalVerifications } = useTeams();
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | 'all'>('all');
  const [showComments, setShowComments] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'working', label: 'Funcionando' },
    { value: 'not_working', label: 'No Funcionando' },
    { value: 'pending', label: 'Sin Verificar' }
  ];

  // Obtener todas las fechas con verificaciones
  const highlightDates = useMemo(() => {
    const dates = new Set();
    globalVerifications.forEach(v => {
      const date = new Date(v.timestamp);
      date.setHours(0, 0, 0, 0);
      dates.add(date.getTime());
    });
    return Array.from(dates).map(timestamp => new Date(timestamp));
  }, [globalVerifications]);

  // Obtener equipos únicos
  const uniqueTeams = useMemo(() => {
    const teams = new Map();
    globalVerifications.forEach(v => {
      if (!teams.has(v.teamId)) {
        teams.set(v.teamId, { id: v.teamId, name: v.teamName });
      }
    });
    return Array.from(teams.values());
  }, [globalVerifications]);

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    setEndDate(date);
  };

  // Verificar si hay pasos sin verificar en el rango de fechas
  const hasPendingSteps = useMemo(() => {
    if (!startDate && !endDate) return false;

    return globalVerifications.some(v => {
      const verificationDate = new Date(v.timestamp);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (verificationDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (verificationDate > end) return false;
      }

      return v.steps.some(step => step.status === 'pending');
    });
  }, [globalVerifications, startDate, endDate]);

  const filteredVerifications = useMemo(() => {
    return globalVerifications
      .filter(v => {
        // Filtro por equipo
        if (selectedTeamId !== 'all' && v.teamId !== selectedTeamId) return false;

        // Filtro por fecha
        if (startDate) {
          const verificationDate = new Date(v.timestamp);
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (verificationDate < start) return false;
        }
        if (endDate) {
          const verificationDate = new Date(v.timestamp);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (verificationDate > end) return false;
        }

        // Filtro por búsqueda
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return (
            v.teamName.toLowerCase().includes(query) ||
            v.featureName.toLowerCase().includes(query) ||
            v.steps.some(step => step.description.toLowerCase().includes(query)) ||
            v.comments.some(comment => comment.text.toLowerCase().includes(query))
          );
        }
        
        return true;
      })
      .map(v => ({
        ...v,
        steps: filter === 'all' ? v.steps : v.steps.filter(step => step.status === filter)
      }))
      .filter(v => v.steps.length > 0)
      .sort((a, b) => {
        // Primero por fecha (más reciente primero)
        if (a.timestamp !== b.timestamp) {
          return b.timestamp - a.timestamp;
        }
        // Luego por ID de equipo
        if (a.teamId !== b.teamId) {
          return a.teamId - b.teamId;
        }
        // Finalmente por número de funcionalidad
        return a.featureNumber - b.featureNumber;
      });
  }, [globalVerifications, selectedTeamId, searchQuery, filter, startDate, endDate]);

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'working':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'not_working':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Historial Global de Verificaciones</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por equipo, funcionalidad, paso o comentario..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">Todos los equipos</option>
                {uniqueTeams.map(team => (
                  <option key={`team-${team.id}`} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                {filterOptions.map(({ value, label }) => (
                  <button
                    key={`filter-${value}`}
                    onClick={() => setFilter(value as VerificationStatus | 'all')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      filter === value
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : value === 'pending' && hasPendingSteps
                        ? 'text-red-600 hover:text-red-800'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Desde:</span>
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    highlightDates={highlightDates}
                    dateFormat="dd/MM/yyyy"
                    className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholderText="Seleccionar fecha"
                    isClearable
                    dayClassName={date => {
                      const timestamp = date.getTime();
                      return highlightDates.some(d => d.getTime() === timestamp)
                        ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        : undefined;
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hasta:</span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    highlightDates={highlightDates}
                    dateFormat="dd/MM/yyyy"
                    className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholderText="Seleccionar fecha"
                    isClearable
                    dayClassName={date => {
                      const timestamp = date.getTime();
                      return highlightDates.some(d => d.getTime() === timestamp)
                        ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        : undefined;
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                  showComments ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <MessageSquare size={16} />
                {showComments ? 'Ocultar comentarios' : 'Mostrar comentarios'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {filteredVerifications.map((verification) => (
              <div
                key={verification.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span className="font-medium">
                      {formatDate(verification.timestamp)}
                    </span>
                  </div>
                  <div className="text-gray-400 hidden sm:block">•</div>
                  <div>
                    <span className="font-medium text-indigo-600">{verification.teamName}</span>
                    <span className="mx-2">→</span>
                    <span className="text-gray-700">
                      <span className="font-medium text-indigo-600">#{verification.featureNumber}</span> {verification.featureName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {verification.steps.map(step => (
                    <div
                      key={`${verification.id}-step-${step.id}`}
                      className={`flex items-center gap-2 p-2 rounded-md ${
                        step.status === 'working'
                          ? 'bg-green-50'
                          : step.status === 'not_working'
                          ? 'bg-red-50'
                          : 'bg-white'
                      }`}
                    >
                      {getStatusIcon(step.status)}
                      <span className={`text-sm ${
                        step.status === 'working'
                          ? 'text-green-600'
                          : step.status === 'not_working'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        <span className="font-medium">#{step.number}</span> - {step.description}
                      </span>
                    </div>
                  ))}
                </div>

                {showComments && verification.comments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare size={16} />
                      <h4 className="text-sm font-medium">Comentarios</h4>
                    </div>
                    {verification.comments.map(comment => (
                      <div
                        key={`${verification.id}-comment-${comment.id}`}
                        className="bg-white p-3 rounded-md border border-gray-100"
                      >
                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                          <span>{comment.author}</span>
                          <span>{formatDate(comment.timestamp)}</span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredVerifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron verificaciones
                {searchQuery && ' con los criterios de búsqueda especificados'}
                {filter !== 'all' && ' con el filtro seleccionado'}
                {selectedTeamId !== 'all' && ' para el equipo seleccionado'}
                {(startDate || endDate) && ' en el rango de fechas seleccionado'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}