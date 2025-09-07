import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, Heart, Tag, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePosts, Post } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';
import { CommentSection } from '../components/CommentSection';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchPostBySlug, deletePost, toggleLike } = usePosts();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const data = await fetchPostBySlug(slug);
      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
      setError('Post not found');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(post.id);
        navigate('/');
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleToggleLike = async () => {
    if (!post || !user) return;

    try {
      await toggleLike(post.id);
      // Reload post to get updated like count
      loadPost();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-500">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-8">{error || 'The post you\'re looking for doesn\'t exist.'}</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.author_id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to posts
      </Link>

      {/* Post Content */}
      <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          {/* Category and Tags */}
          <div className="flex items-center gap-2 mb-4">
            {post.categories && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Tag className="h-3 w-3 mr-1" />
                {post.categories.name}
              </span>
            )}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author and Date */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {post.profiles.full_name || post.profiles.email}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{format(new Date(post.created_at), 'MMMM d, yyyy')}</span>
                  {post.updated_at !== post.created_at && (
                    <span className="ml-2">
                      (Updated {format(new Date(post.updated_at), 'MMM d, yyyy')})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Like Button */}
              <button
                onClick={handleToggleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  user
                    ? post.user_liked
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-red-600'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!user}
                title={user ? 'Like post' : 'Sign in to like posts'}
              >
                <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
                <span>{post.likes_count}</span>
              </button>

              {/* Author Actions */}
              {isAuthor && (
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/edit/${post.id}`}
                    className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit post"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {post.content}
            </div>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <CommentSection postId={post.id} />
    </div>
  );
}