import React, { useState } from 'react';
import { Heart, Reply, Trash2, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useComments, Comment } from '../hooks/useComments';
import { useAuth } from '../hooks/useAuth';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const { comments, loading, createComment, deleteComment, toggleCommentLike } = useComments(postId);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await createComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    try {
      await createComment(replyContent, parentId);
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    if (!user) return;

    try {
      await toggleCommentLike(commentId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8' : ''} space-y-3`}>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {comment.profiles.full_name || comment.profiles.email}
            </span>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
          </div>
          
          {user?.id === comment.author_id && (
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-gray-700 text-sm mb-3">{comment.content}</p>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleToggleLike(comment.id)}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              user ? 'hover:text-red-500' : 'cursor-not-allowed'
            } text-gray-500`}
            disabled={!user}
          >
            <Heart className="h-3 w-3" />
            <span>{comment.likes_count}</span>
          </button>

          {!isReply && user && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Reply className="h-3 w-3" />
              <span>Reply</span>
            </button>
          )}
        </div>

        {replyingTo === comment.id && (
          <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border border-gray-300 rounded-md resize-none text-sm"
              rows={2}
              required
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
              >
                Reply
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Comments</h3>

      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full p-4 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            required
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-8 text-center">
          <p className="text-gray-600">
            <a href="/auth" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>{' '}
            to join the discussion
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 text-sm mt-2">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}