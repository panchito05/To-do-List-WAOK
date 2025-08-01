import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Upload, FileText, Trash2, Edit3, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotebookModal({ isOpen, onClose }: NotebookModalProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes from localStorage on component mount
  useEffect(() => {
    if (isOpen) {
      const savedNotes = localStorage.getItem('qa-notebook-notes') || '';
      setNotes(savedNotes);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 400) + 'px';
    }
  };

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [notes, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Save to localStorage
    localStorage.setItem('qa-notebook-notes', notes);
    
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustTextareaHeight();
    }, 100);
  };

  const handleCancel = () => {
    // Reload notes from localStorage
    const savedNotes = localStorage.getItem('qa-notebook-notes') || '';
    setNotes(savedNotes);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[rgb(var(--bg-primary))] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border))]">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-[rgb(var(--primary))]" />
            <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
              {t('notebook.title', 'Notebook')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {t('common.save', 'Save')}
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit3 size={16} />
                {t('common.edit', 'Edit')}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 h-full">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  adjustTextareaHeight();
                }}
                placeholder={t('notebook.placeholder', 'Start writing your notes here...')}
                className="w-full h-full min-h-[300px] p-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-secondary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
                style={{ minHeight: '300px' }}
              />
            ) : (
              <div className="h-full">
                {notes ? (
                  <div className="p-4 bg-[rgb(var(--bg-secondary))] rounded-lg border border-[rgb(var(--border))] h-full overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-[rgb(var(--text-primary))] font-mono text-sm">
                      {notes}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FileText size={48} className="text-[rgb(var(--text-tertiary))] mb-4" />
                    <p className="text-[rgb(var(--text-secondary))] text-lg mb-2">
                      {t('notebook.empty', 'No notes yet')}
                    </p>
                    <p className="text-[rgb(var(--text-tertiary))] text-sm mb-6">
                      {t('notebook.emptyDescription', 'Click Edit to start writing your notes')}
                    </p>
                    <button
                      onClick={handleEdit}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Edit3 size={16} />
                      {t('notebook.startWriting', 'Start Writing')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))]">
          <p className="text-xs text-[rgb(var(--text-tertiary))] text-center">
            {t('notebook.autoSave', 'Notes are automatically saved to your browser\'s local storage')}
          </p>
        </div>
      </div>
    </div>
  );
}