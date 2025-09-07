import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

export function useComments(postId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const fetchComments = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (full_name, email, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into a tree structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data?.forEach((comment) => {
        const commentWithReplies = { ...comment, replies: [] };
        commentMap.set(comment.id, commentWithReplies);

        if (!comment.parent_id) {
          rootComments.push(commentWithReplies);
        }
      });

      data?.forEach((comment) => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies!.push(commentMap.get(comment.id)!);
          }
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (content: string, parentId?: string) => {
    if (!postId) throw new Error('No post ID provided');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            author_id: userData.user.id,
            parent_id: parentId || null,
            content,
          },
        ]);

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userData.user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert([
            {
              comment_id: commentId,
              user_id: userData.user.id,
            },
          ]);
      }

      await fetchComments();
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    error,
    createComment,
    deleteComment,
    toggleCommentLike,
    refetch: fetchComments,
  };
}