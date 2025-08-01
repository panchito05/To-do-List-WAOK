import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Search, Info, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Team, GlobalVerification } from '../types';
import { useTeams } from '../context/TeamsContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import TeamSection from './TeamSection';

interface TeamComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamComparisonModal({ isOpen, onClose }: TeamComparisonModalProps) {
  const { t } = useTranslation();
  const { teams, globalVerifications } = useTeams();
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [leftTeam, setLeftTeam] = useState<Team | null>(null);
  const [rightTeam, setRightTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableHistoricDates, setAvailableHistoricDates] = useState<Date[]>([]);
  const [teamVerificationsMap, setTeamVerificationsMap] = useState<Map<string, GlobalVerification[]>>(new Map());
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [uniqueTeamsMap, setUniqueTeamsMap] = useState<Map<number, string>>(new Map());
  
  // Agrupar verificaciones por fecha y equipo
  useEffect(() => {
    if (!isOpen) return;
    
    const dates = new Set<number>();
    const teamVerifMap = new Map<string, GlobalVerification[]>();
    const uniqueTeams = new Map<number, string>();

    globalVerifications.forEach(verification => {
      // Añadir fecha para el selector
      const date = new Date(verification.timestamp);
      date.setHours(0, 0, 0, 0);
      dates.add(date.getTime());
      
      // Registrar equipos únicos
      uniqueTeams.set(verification.teamId, verification.teamName);
      
      // Agrupar por equipo y fecha
      const teamKey = `${verification.teamId}`;
      if (!teamVerifMap.has(teamKey)) {
        teamVerifMap.set(teamKey, []);
      }
      
      const teamVerifications = teamVerifMap.get(teamKey)!;
      teamVerifications.push(verification);
    });
    
    // Ordenar verificaciones dentro de cada equipo por timestamp
    teamVerifMap.forEach((verifications, key) => {
      teamVerifMap.set(
        key, 
        verifications.sort((a, b) => b.timestamp - a.timestamp)
      );
    });
    
    const sortedDates = Array.from(dates)
      .map(timestamp => new Date(timestamp))
      .sort((a, b) => b.getTime() - a.getTime());
    
    setAvailableHistoricDates(sortedDates);
    setTeamVerificationsMap(teamVerifMap);
    setUniqueTeamsMap(uniqueTeams);
    
    // Inicializar con la fecha más reciente y siguiente más reciente
    if (sortedDates.length > 0) {
      // Establecer fechas iniciales para el lado izquierdo
      const mostRecentDate = sortedDates[0];
      setStartDate(mostRecentDate);
      setEndDate(mostRecentDate);
    }
  }, [isOpen, globalVerifications]);

// Efecto para seleccionar automáticamente los equipos cuando cambian las fechas
useEffect(() => {
  if (!startDate || !endDate || !teamVerificationsMap.size) return;

  // Obtener todas las verificaciones ordenadas por timestamp
  const allVerifications = Array.from(teamVerificationsMap.values())
    .flat()
    .sort((a, b) => b.timestamp - a.timestamp);

  // Encontrar las dos últimas verificaciones de diferentes equipos
  const uniqueTeamVerifications = allVerifications.reduce((acc, curr) => {
    if (acc.length < 2 && !acc.some(v => v.teamId === curr.teamId)) {
      acc.push(curr);
    }
    return acc;
  }, [] as GlobalVerification[]);

  if (uniqueTeamVerifications.length > 0) {
    // Configurar el equipo izquierdo con la verificación más reciente
    const latestVerification = uniqueTeamVerifications[0];
    const latestTeam = reconstructTeamForDateRange(
      latestVerification.teamId,
      latestVerification.teamName,
      startDate,
      endDate
    );
    if (latestTeam) {
      setLeftTeam(latestTeam);
    }

    // Configurar el equipo derecho con la segunda verificación más reciente
    if (uniqueTeamVerifications.length > 1) {
      const secondVerification = uniqueTeamVerifications[1];
      const secondTeam = reconstructTeamForDateRange(
        secondVerification.teamId,
        secondVerification.teamName,
        startDate,
        endDate
      );
      if (secondTeam) {
        setRightTeam(secondTeam);
      }
    }
  }
}, [startDate, endDate, teamVerificationsMap]);
  
  // Obtener todas las verificaciones por equipo y rango de fechas
  const getTeamVerificationsForDateRange = (
    teamId: number, 
    startDate: Date | null, 
    endDate: Date | null
  ): GlobalVerification[] => {
    if (!startDate || !endDate || !teamVerificationsMap.has(`${teamId}`)) return [];
    
    const allTeamVerifications = teamVerificationsMap.get(`${teamId}`)!;
    
    // Filtrar verificaciones por rango de fechas
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);
    
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);
    
    return allTeamVerifications.filter(v => {
      const vDate = new Date(v.timestamp);
      return vDate >= normalizedStartDate && vDate <= normalizedEndDate;
    });
  };
  
  // Verificar si un equipo tiene verificaciones en un rango de fechas
  const hasVerificationsInDateRange = (
    teamId: number, 
    startDate: Date | null, 
    endDate: Date | null
  ): boolean => {
    return getTeamVerificationsForDateRange(teamId, startDate, endDate).length > 0;
  };
  
  // Reconstruir un equipo a partir de verificaciones para un rango de fechas
  const reconstructTeamForDateRange = (
    teamId: number, 
    teamName: string, 
    startDate: Date | null, 
    endDate: Date | null
  ): Team | null => {
    if (!startDate || !endDate) return null;
    
    const teamVerifications = getTeamVerificationsForDateRange(teamId, startDate, endDate);
    if (teamVerifications.length === 0) return null;
    
    // Crear un mapa de funcionalidades por número para mantener el orden original
    const featureMapByNumber = new Map<number, any>();
    
    // Primero, recopilar todas las funcionalidades únicas de las verificaciones
    teamVerifications.forEach(v => {
      if (!featureMapByNumber.has(v.featureNumber)) {
        featureMapByNumber.set(v.featureNumber, {
          id: v.featureId,
          number: v.featureNumber,
          name: v.featureName,
          steps: [],
          comments: v.comments || [],
          timestamp: v.timestamp
        });
      }
    });
    
    // Luego, para cada funcionalidad, recopilar los pasos más recientes de ese rango de fechas
    featureMapByNumber.forEach((feature, featureNumber) => {
      // Filtrar verificaciones de esta funcionalidad específica
      const featureVerifications = teamVerifications.filter(v => 
        v.featureNumber === featureNumber
      ).sort((a, b) => b.timestamp - a.timestamp);
      
      if (featureVerifications.length > 0) {
        // Usar la verificación más reciente para esta funcionalidad
        const latestVerification = featureVerifications[0];
        
        // Actualizar la información de la funcionalidad
        feature.name = latestVerification.featureName;
        feature.comments = latestVerification.comments;
        feature.timestamp = latestVerification.timestamp;
        
        // Crear un mapa de pasos por número para preservar el orden original
        const stepsMap = new Map();
        
        // Añadir todos los pasos manteniendo su número original
        latestVerification.steps.forEach(step => {
          stepsMap.set(step.number, {
            id: step.id,
            number: step.number,
            description: step.description,
            status: step.status,
            order: step.number - 1
          });
        });
        
        // Convertir el mapa a un array ordenado por número de paso
        feature.steps = Array.from(stepsMap.values())
          .sort((a, b) => a.number - b.number);
      }
    });
    
    // Convertir el mapa a un array de funcionalidades ordenadas por número
    const features = Array.from(featureMapByNumber.values())
      .sort((a, b) => a.number - b.number)
      .map(f => ({
        id: f.id,
        number: f.number,
        name: f.name,
        steps: f.steps,
        comments: f.comments || [],
        verifications: []
      }));
    
    // Formatear el rango de fechas para el nombre del equipo
    const startDateStr = startDate.toLocaleDateString();
    const endDateStr = endDate.toLocaleDateString();
    const dateRangeStr = startDateStr === endDateStr 
      ? startDateStr 
      : `${startDateStr} - ${endDateStr}`;
    
    const reconstructedTeam: Team = {
      id: teamId,
      name: `${teamName} (${dateRangeStr})`,
      features
    };
    
    return reconstructedTeam;
  };
  
  // Lista de equipos históricos disponibles para ambos lados
  const [leftTeamOptions, setLeftTeamOptions] = useState<{id: number, name: string, hasVerifications: boolean}[]>([]);
  const [rightTeamOptions, setRightTeamOptions] = useState<{id: number, name: string, hasVerifications: boolean}[]>([]);
  
  // Generar opciones de equipos basados en el rango de fechas seleccionado
  useEffect(() => {
    // Requerir al menos una fecha para cada lado
    const canGenerateOptions = startDate !== null && endDate !== null;
    
    if (!canGenerateOptions) return;
    
    const generateTeamOptions = (startDate: Date | null, endDate: Date | null): {id: number, name: string, hasVerifications: boolean}[] => {
      if (!startDate || !endDate) return [];
      
      return Array.from(uniqueTeamsMap.entries()).map(([teamId, teamName]) => ({
        id: teamId,
        name: teamName,
        hasVerifications: hasVerificationsInDateRange(teamId, startDate, endDate)
      }));
    };
    
    // Generar opciones para cada lado si es posible
    const options = generateTeamOptions(startDate, endDate);
    setLeftTeamOptions(options);
    setRightTeamOptions(options);
    
    // Resetear equipos seleccionados si cambiaron las fechas y ya no están disponibles
    if (leftTeam && !options.some(t => t.id === leftTeam.id && t.hasVerifications)) {
      setLeftTeam(null);
    }
    
    if (rightTeam && !options.some(t => t.id === rightTeam.id && t.hasVerifications)) {
      setRightTeam(null);
    }
  }, [startDate, endDate, uniqueTeamsMap]);
  
  // Reconstruir equipos cuando se selecciona un equipo o cambia el rango de fechas
  useEffect(() => {
    if (leftTeam?.id && startDate && endDate) {
      const teamName = uniqueTeamsMap.get(leftTeam.id) || leftTeam.name;
      const reconstructed = reconstructTeamForDateRange(leftTeam.id, teamName, startDate, endDate);
      if (reconstructed) {
        setLeftTeam(reconstructed);
      }
    }
    
    if (rightTeam?.id && startDate && endDate) {
      const teamName = uniqueTeamsMap.get(rightTeam.id) || rightTeam.name;
      const reconstructed = reconstructTeamForDateRange(rightTeam.id, teamName, startDate, endDate);
      if (reconstructed) {
        setRightTeam(reconstructed);
      }
    }
  }, [leftTeam?.id, rightTeam?.id, startDate, endDate]);
  
  // Equipos filtrados por búsqueda
  const filteredLeftTeams = useMemo(() => {
    if (!searchQuery.trim()) return leftTeamOptions;
    
    const query = searchQuery.toLowerCase();
    return leftTeamOptions.filter(team => 
      team.name.toLowerCase().includes(query)
    );
  }, [leftTeamOptions, searchQuery]);
  
  const filteredRightTeams = useMemo(() => {
    if (!searchQuery.trim()) return rightTeamOptions;
    
    const query = searchQuery.toLowerCase();
    return rightTeamOptions.filter(team => 
      team.name.toLowerCase().includes(query)
    );
  }, [rightTeamOptions, searchQuery]);
  
  // Estadísticas de verificaciones
  const verificationStats = useMemo(() => {
    // Total de verificaciones
    const totalVerifications = globalVerifications.length;
    
    // Fechas únicas
    const uniqueDates = new Set<string>();
    globalVerifications.forEach(v => {
      const date = new Date(v.timestamp).toISOString().split('T')[0];
      uniqueDates.add(date);
    });
    
    // Equipos únicos
    const uniqueTeams = new Set<number>();
    globalVerifications.forEach(v => {
      uniqueTeams.add(v.teamId);
    });
    
    return {
      total: totalVerifications,
      dates: uniqueDates.size,
      teams: uniqueTeams.size
    };
  }, [globalVerifications]);
  
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    // Si se selecciona una fecha de inicio y es posterior a la fecha de fin, actualizar la fecha de fin
    if (date && endDate && date > endDate) {
      setEndDate(date);
    }
    // Resetear equipos seleccionados al cambiar fecha
    setLeftTeam(null);
    setRightTeam(null);
  };
  
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    // Si se selecciona una fecha de fin y es anterior a la fecha de inicio, actualizar la fecha de inicio
    if (date && startDate && date < startDate) {
      setStartDate(date);
    }
    // Resetear equipos seleccionados al cambiar fecha
    setLeftTeam(null);
    setRightTeam(null);
  };
  
  if (!isOpen) return null;
  
  const formatDateRange = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return '';
    
    const startFormatted = startDate.toLocaleDateString();
    const endFormatted = endDate.toLocaleDateString();
    
    return startFormatted === endFormatted 
      ? startFormatted 
      : `${startFormatted} - ${endFormatted}`;
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full h-[95vh] overflow-hidden flex flex-col">
        <div className="border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 p-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('Team Comparison')}</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-700 text-sm">
                <Info size={16} />
                <span>
                  {t('Stored verifications')}: {verificationStats.total} 
                  ({verificationStats.dates} {t('dates')}, {verificationStats.teams} {t('teams')})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6">
              <button
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
                title={isHeaderExpanded ? 'Ocultar opciones' : 'Mostrar opciones'}
              >
                {isHeaderExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 px-6 overflow-hidden transition-all duration-300 ${
            isHeaderExpanded ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 mb-4">{t('Date Range')}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('Start Date')}:</p>
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    highlightDates={availableHistoricDates}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholderText={t('Select start date')}
                    isClearable
                    dayClassName={date => {
                      const timestamp = date.getTime();
                      return availableHistoricDates.some(d => d.getTime() === timestamp)
                        ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        : undefined;
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('End Date')}:</p>
                  <DatePicker
                    selected={endDate}
                    onChange={handleEndDateChange}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    highlightDates={availableHistoricDates}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholderText={t('Select end date')}
                    isClearable
                    dayClassName={date => {
                      const timestamp = date.getTime();
                      return availableHistoricDates.some(d => d.getTime() === timestamp)
                        ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        : undefined;
                    }}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('Left Team')}:</p>
                {startDate && endDate ? (
                  <>
                    <select
                      value={leftTeam?.id || ''}
                      onChange={(e) => {
                        const teamId = parseInt(e.target.value);
                        if (!isNaN(teamId)) {
                          const teamName = uniqueTeamsMap.get(teamId) || '';
                          const reconstructed = reconstructTeamForDateRange(teamId, teamName, startDate, endDate);
                          if (reconstructed) {
                            setLeftTeam(reconstructed);
                          }
                        } else {
                          setLeftTeam(null);
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">{t('Select a team...')}</option>
                      {filteredLeftTeams.map(team => (
                        <option 
                          key={`left-${team.id}`} 
                          value={team.id}
                          disabled={!team.hasVerifications}
                        >
                          {team.name} {!team.hasVerifications ? `(${t('No verifications in date range')})` : ''}
                        </option>
                      ))}
                    </select>
                    
                    {filteredLeftTeams.length > 0 && filteredLeftTeams.every(team => !team.hasVerifications) && (
                      <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} />
                        <span>{t('No teams have verifications in this date range')}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-2 rounded-lg">
                    <Info size={18} />
                    <span className="text-sm">{t('Select date range first')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 mb-4">{t('Teams')}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 invisible">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">&nbsp;</p>
                  <div className="w-full px-3 py-2 border rounded-lg opacity-0">
                    &nbsp;
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">&nbsp;</p>
                  <div className="w-full px-3 py-2 border rounded-lg opacity-0">
                    &nbsp;
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('Right Team')}:</p>
                {startDate && endDate ? (
                  <>
                    <select
                      value={rightTeam?.id || ''}
                      onChange={(e) => {
                        const teamId = parseInt(e.target.value);
                        if (!isNaN(teamId)) {
                          const teamName = uniqueTeamsMap.get(teamId) || '';
                          const reconstructed = reconstructTeamForDateRange(teamId, teamName, startDate, endDate);
                          if (reconstructed) {
                            setRightTeam(reconstructed);
                          }
                        } else {
                          setRightTeam(null);
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">{t('Select a team...')}</option>
                      {filteredRightTeams.map(team => (
                        <option 
                          key={`right-${team.id}`} 
                          value={team.id}
                          disabled={!team.hasVerifications}
                        >
                          {team.name} {!team.hasVerifications ? `(${t('No verifications in date range')})` : ''}
                        </option>
                      ))}
                    </select>
                    
                    {filteredRightTeams.length > 0 && filteredRightTeams.every(team => !team.hasVerifications) && (
                      <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} />
                        <span>{t('No teams have verifications in this date range')}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-2 rounded-lg">
                    <Info size={18} />
                    <span className="text-sm">{t('Select date range first')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={`flex-1 px-6 pb-6 ${isHeaderExpanded ? '' : 'hidden'}`}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search teams, features, or steps...')}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {(!startDate || !endDate) ? (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-8">
              <p className="text-gray-500 text-center flex flex-col items-center gap-3">
                
                <AlertCircle size={32} className="text-gray-400" />
                <span>{t('Please select date ranges for comparison')}</span>
                <span>{t('Please select a date range for comparison')}</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  <span>
                    {leftTeam ? leftTeam.name : t('Select Team')} - {formatDateRange(startDate, endDate)}
                  </span>
                </h3>
                
                {leftTeam ? (
                  <div className="comparison-team">
                    <TeamSection
                      team={leftTeam}
                      onDuplicate={() => {}}  
                      onDelete={() => {}}
                      onUpdateName={() => {}} 
                      onUpdateTeam={() => {}}
                      isReadOnly={true}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">
                      {t('Please select a team from the dropdown')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  <span>
                    {rightTeam ? rightTeam.name : t('Select Team')} - {formatDateRange(startDate, endDate)}
                  </span>
                </h3>
                
                {rightTeam ? (
                  <div className="comparison-team">
                    <TeamSection
                      team={rightTeam}
                      onDuplicate={() => {}}
                      onDelete={() => {}}
                      onUpdateName={() => {}}
                      onUpdateTeam={() => {}}
                      isReadOnly={true}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">
                      {t('Please select a team from the dropdown')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}