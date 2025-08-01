import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Upload, FileText, Image, Video, File, Trash2, ExternalLink, Download, Edit3, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { NoteFile } from '../types';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotebookModal({ isOpen, onClose }: NotebookModalProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'files'>('notes');
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit'); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar notas al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsOffline(false);

        // Intentar cargar desde Supabase
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          setNotes(data[0].content);
          setNoteId(data[0].id);
          setFiles(Array.isArray(data[0].files) ? data[0].files : []);
        } else {
          // Crear una nueva nota si no existe ninguna
          const { data: newNote, error: createError } = await supabase
            .from('notes')
            .insert([{ content: '', files: [] }])
            .select()
            .single();

          if (createError) throw createError;

          if (newNote) {
            setNotes(newNote.content);
            setNoteId(newNote.id);
            setFiles([]);
          }
        }
      } catch (err) {
        console.error('Error loading notes:', err);
        setError('Error al cargar las notas');
        setIsOffline(true);
        
        // Usar localStorage como respaldo
        const savedNotes = localStorage.getItem('qa-notebook-notes');
        if (savedNotes) {
          setNotes(savedNotes);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();

    // Suscribirse a cambios en tiempo real
    const channel = supabase.channel('notes_changes');
    
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notes',
        },
        (payload) => {
          // Actualizar solo si el cambio viene de otro cliente y es para nuestra nota
          if (payload.new && payload.new.id === noteId) {
            setNotes(payload.new.content);
            if (payload.new.files) {
              setFiles(Array.isArray(payload.new.files) ? payload.new.files : []);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to notes changes');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, noteId]);

  // Guardar notas con debounce
  useEffect(() => {
    if (!noteId || !notes) return;

    const saveNotes = async () => {
      try {
        setIsSaving(true);
        setError(null);
        
        // Siempre guardar en localStorage como respaldo
        localStorage.setItem('qa-notebook-notes', notes);

        if (!isOffline) {
          const { error } = await supabase
            .from('notes')
            .update({ content: notes })
            .eq('id', noteId);

          if (error) throw error;
        }
      } catch (err) {
        console.error('Error saving notes:', err);
        setError('Error al guardar las notas');
        setIsOffline(true);
      } finally {
        setIsSaving(false);
      }
    };

    const timeoutId = setTimeout(saveNotes, 1000);
    return () => clearTimeout(timeoutId);
  }, [notes, noteId, isOffline]);

  const handleSave = async () => {
    if (!noteId) return;

    try {
      setIsSaving(true);
      setError(null);

      // Siempre guardar en localStorage
      localStorage.setItem('qa-notebook-notes', notes);

      if (!isOffline) {
        const { error } = await supabase
          .from('notes')
          .update({ content: notes })
          .eq('id', noteId);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      setError('Error al guardar las notas');
      setIsOffline(true);
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || !noteId) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        const fileExt = file.name.split('.').pop();
        const filePath = `notes/${noteId}/${fileId}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('qa-notes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('qa-notes')
          .getPublicUrl(filePath);

        // Create new file object
        const newFile: NoteFile = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrl,
          createdAt: new Date().toISOString()
        };

        // Update files array
        const updatedFiles = [...files, newFile];
        setFiles(updatedFiles);

        // Update note in Supabase
        const { error: updateError } = await supabase
          .from('notes')
          .update({ files: updatedFiles })
          .eq('id', noteId);

        if (updateError) throw updateError;

        // Update progress
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileToDelete: NoteFile) => {
    if (!noteId) return;

    try {
      setIsSaving(true);
      
      // Delete file from storage
      const filePath = `notes/${noteId}/${fileToDelete.id}`;
      const { error: storageError } = await supabase.storage
        .from('qa-notes')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }

      // Update files list
      const updatedFiles = files.filter(file => file.id !== fileToDelete.id);
      setFiles(updatedFiles);

      // Update note in database
      const { error } = await supabase
        .from('notes')
        .update({ files: updatedFiles })
        .eq('id', noteId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Error deleting file');
    } finally {
      setIsSaving(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={24} className="text-emerald-500 dark:text-emerald-400" />;
    if (fileType.startsWith('video/')) return <Video size={24} className="text-purple-500 dark:text-purple-400" />;
    if (fileType.startsWith('application/pdf')) return <FileText size={24} className="text-red-500 dark:text-red-400" />;
    if (fileType.startsWith('application/msword') || fileType.includes('document')) return <FileText size={24} className="text-blue-500 dark:text-blue-400" />;
    return <File size={24} className="text-[rgb(var(--text-secondary))]" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Función para convertir URLs en texto a enlaces clickeables
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    
    // Expresión regular para identificar URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9._-]+\.[a-zA-Z]{2,}\/[^\s]*)/g;
    
    // Dividir el texto en segmentos (URL y no URL)
    const segments = text.split(urlRegex);
    
    // Extraer las URLs coincidentes
    const matches = text.match(urlRegex) || [];
    
    // Crear un array con los segmentos de texto y URLs
    const result = [];
    let matchIndex = 0;
    
    for (let i = 0; i < segments.length; i++) {
      if (segments[i]) {
        // Si es una URL coincidente, añadir como enlace
        if (matches.includes(segments[i])) {
          let href = segments[i];
          // Asegurarse de que la URL tenga el protocolo
          if (!href.startsWith('http')) {
            href = 'https://' + href;
          }
          
          result.push(
            <a 
              key={`link-${i}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[rgb(var(--primary-600))] hover:text-[rgb(var(--primary-700))] underline break-words"
            >
              {segments[i]}
            </a>
          );
          matchIndex++;
        } else {
          // Añadir segmento de texto normal
          result.push(<span key={`text-${i}`}>{segments[i]}</span>);
        }
      }
    }
    
    // Si no hay resultados, devolver el texto original
    if (result.length === 0) {
      return <span>{text}</span>;
    }
    
    return <div className="whitespace-pre-wrap break-words">{result}</div>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[rgb(var(--bg-primary))] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-[rgb(var(--border-primary))] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Notas</h2>
            {isOffline && (
              <span className="px-2 py-1 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full">
                Modo sin conexión
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-sm text-[rgb(var(--error))]">{error}</span>
            )}
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                isSaving
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : isLoading
                  ? 'bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-tertiary))] cursor-not-allowed'
                  : 'bg-[rgb(var(--primary-50))] dark:bg-[rgb(var(--primary-900))]/20 text-[rgb(var(--primary-600))] hover:bg-[rgb(var(--primary-100))] dark:hover:bg-[rgb(var(--primary-800))]/30'
              }`}
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>
                {isSaving ? 'Guardando...' : isLoading ? 'Cargando...' : 'Guardar'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-[rgb(var(--border-primary))]">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'notes'
                ? 'text-[rgb(var(--primary-600))] border-b-2 border-[rgb(var(--primary-600))]'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Notas
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'files'
                ? 'text-[rgb(var(--primary-600))] border-b-2 border-[rgb(var(--primary-600))]'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            Archivos
            {files.length > 0 && (
              <span className="px-2 py-0.5 bg-[rgb(var(--primary-100))] dark:bg-[rgb(var(--primary-900))]/20 text-[rgb(var(--primary-600))] rounded-full text-xs">
                {files.length}
              </span>
            )}
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-[rgb(var(--primary-600))]" />
            </div>
          ) : activeTab === 'notes' ? (
            <div className="h-full flex flex-col">
              {/* Botones de modo de visualización */}
              <div className="flex justify-end mb-2">
                <div className="inline-flex rounded-lg border border-[rgb(var(--border-primary))] overflow-hidden">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                      viewMode === 'edit' 
                        ? 'bg-[rgb(var(--primary-50))] dark:bg-[rgb(var(--primary-900))]/20 text-[rgb(var(--primary-600))] font-medium'
                        : 'bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]'
                    }`}
                  >
                    <Edit3 size={16} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                      viewMode === 'preview' 
                        ? 'bg-[rgb(var(--primary-50))] dark:bg-[rgb(var(--primary-900))]/20 text-[rgb(var(--primary-600))] font-medium'
                        : 'bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]'
                    }`}
                  >
                    <Eye size={16} />
                    <span>Vista previa</span>
                  </button>
                </div>
              </div>
              
              {/* Contenido de notas según el modo */}
              {viewMode === 'edit' ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-full min-h-[400px] p-4 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-primary))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary-500))] resize-none flex-grow"
                  placeholder="Escribe tus notas aquí..."
                  disabled={isLoading}
                />
              ) : (
                <div className="w-full h-full min-h-[400px] p-4 border border-[rgb(var(--border-primary))] rounded-lg overflow-auto bg-[rgb(var(--bg-secondary))] flex-grow">
                  {notes ? renderTextWithLinks(notes) : (
                    <p className="text-[rgb(var(--text-tertiary))] italic">No hay contenido para mostrar</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[rgb(var(--text-primary))]">Archivos adjuntos</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <button
                  onClick={handleFileSelect}
                  disabled={isUploading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isUploading
                      ? 'bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-tertiary))] cursor-not-allowed'
                      : 'bg-[rgb(var(--primary-600))] text-white hover:bg-[rgb(var(--primary-700))]'
                  }`}
                >
                  {isUploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  <span>{isUploading ? 'Subiendo...' : 'Subir archivo'}</span>
                </button>
              </div>

              {isUploading && (
                <div className="mb-4">
                  <div className="h-2 bg-[rgb(var(--bg-secondary))] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[rgb(var(--primary-600))] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-[rgb(var(--text-secondary))] mt-2">
                    Subiendo... {uploadProgress}%
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-[rgb(var(--error))] rounded-md mb-4">
                  {uploadError}
                </div>
              )}

              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[rgb(var(--border-primary))] rounded-lg">
                  <File size={48} className="text-[rgb(var(--text-tertiary))] mb-3" />
                  <p className="text-[rgb(var(--text-secondary))] mb-2">No hay archivos adjuntos</p>
                  <button
                    onClick={handleFileSelect}
                    className="text-[rgb(var(--primary-600))] hover:text-[rgb(var(--primary-700))] font-medium"
                  >
                    Haga clic para subir
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-[rgb(var(--bg-secondary))] rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-[rgb(var(--text-secondary))]">
                            {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] rounded-full"
                          title="Abrir archivo"
                        >
                          <ExternalLink size={18} />
                        </a>
                        <a
                          href={file.url}
                          download={file.name}
                          className="p-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))] rounded-full"
                          title="Descargar archivo"
                        >
                          <Download size={18} />
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-2 text-[rgb(var(--error))] hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                          title="Eliminar archivo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}