import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { commentsAPI } from '../../services/api';
import socketService from '../../services/socket';
import type { Task, Comment } from '../../types';
import { X, Send, Trash2, Clock } from 'lucide-react';
import { formatRelative, getPriorityColor, getStatusColor } from '../../utils/helpers';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const response = await commentsAPI.getByTask(task.id);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  // Real-time handlers
  const handleCommentCreated = useCallback((comment: Comment) => {
    console.log('💬 Real-time: Comment created', comment);
    setComments(prev => [...prev, comment]);
  }, []);

  const handleCommentDeleted = useCallback((data: { id: number }) => {
    console.log('🗑️ Real-time: Comment deleted', data.id);
    setComments(prev => prev.filter(c => c.id !== data.id));
  }, []);

  // Setup WebSocket
  useEffect(() => {
    // Join task room
    socketService.joinTask(task.id.toString());

    // Subscribe to events
    socketService.onCommentCreated(handleCommentCreated);
    socketService.onCommentDeleted(handleCommentDeleted);

    // Fetch initial comments
    fetchComments();

    // Cleanup
    return () => {
      socketService.offCommentCreated(handleCommentCreated);
      socketService.offCommentDeleted(handleCommentDeleted);
      socketService.leaveTask(task.id.toString());
    };
  }, [task.id, fetchComments, handleCommentCreated, handleCommentDeleted]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await commentsAPI.create({
        content: newComment,
        taskId: task.id,
      });
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await commentsAPI.delete(commentId);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete comment');
    }
  };

  const canDeleteComment = (comment: Comment) => {
    // User can delete if they're the author
    return comment.authorId === user?.id;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{task.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                {task.priority} priority
              </span>
              {task.assignee && (
                <span className="text-sm text-gray-600">
                  Assigned to: <strong>{task.assignee.name}</strong>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Task Details */}
        <div className="p-6 border-b border-gray-200">
          {task.description ? (
            <p className="text-gray-700">{task.description}</p>
          ) : (
            <p className="text-gray-400 italic">No description</p>
          )}
          
          {task.dueDate && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Due: {formatRelative(task.dueDate)}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comments ({comments.length})
          </h3>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="font-medium text-gray-900">{comment.author.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatRelative(comment.createdAt)}
                        </span>
                      </div>
                      
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmitComment} className="flex gap-3">
            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 input bg-white"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};