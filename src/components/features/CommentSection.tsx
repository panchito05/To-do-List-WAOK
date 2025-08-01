import React, { useState } from 'react';
import { MessageSquare, Send, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Comment } from '../../types';
import ConfirmationModal from '../ConfirmationModal';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  onUpdateComment: (commentId: number, newText: string) => void;
  onDeleteComment: (commentId: number) => void;
}

function CommentSection({ 
  comments, 
  onAddComment, 
  onUpdateComment, 
  onDeleteComment 
}: CommentSectionProps) {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleUpdate = () => {
    if (editingCommentId && editingText.trim()) {
      onUpdateComment(editingCommentId, editingText.trim());
      setEditingCommentId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-700">
        <MessageSquare size={16} />
        <h5 className="font-medium">{t('common.comments')}</h5>
      </div>

      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{comment.author}</span>
              <span>{new Date(comment.timestamp).toLocaleString()}</span>
            </div>
            {editingCommentId === comment.id ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  onClick={handleUpdate}
                  className="text-green-600 hover:text-green-700 p-2"
                  title={t('common.save')}
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-red-600 hover:text-red-700 p-2"
                  title={t('common.cancel')}
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-start gap-2">
                <p className="text-gray-800 flex-1">{comment.text}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(comment)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title={t('common.edit')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setCommentToDelete(comment)}
                    className="text-red-400 hover:text-red-600 p-1"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            {t('common.noComments')}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('messages.commentPlaceholder')}
          className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
          title={t('actions.addComment')}
        >
          <Send size={20} />
        </button>
      </div>

      <ConfirmationModal
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={() => {
          if (commentToDelete) {
            onDeleteComment(commentToDelete.id);
            setCommentToDelete(null);
          }
        }}
        title={t('common.delete')}
        message={t('messages.confirmDelete')}
        confirmText={t('common.delete')}
      />
    </div>
  );
}

export default CommentSection;