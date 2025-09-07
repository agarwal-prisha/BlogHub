import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Post } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';

interface PostCardProps {
  post: Post;
  onToggleLike?: (postId: string) => void;
}

export function PostCard({ post, onToggleLike }: PostCardProps) {
  const { user } = useAuth();

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user && onToggleLike) {
      onToggleLike(post.id);
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Category and Tags */}
        <div className="flex items-center gap-2 mb-3">
          {post.categories && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Tag className="h-3 w-3 mr-1" />
              {post.categories.name}
            </span>
          )}
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Title and Excerpt */}
        <Link to={`/post/${post.slug}`} className="block group">
          <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}
        </Link>

        {/* Author and Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-gray-600" />
              </div>
              <span className="font-medium">
                {post.profiles.full_name || post.profiles.email}
              </span>
            </div>
            <span className="mx-2">•</span>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLikeClick}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                user
                  ? post.user_liked
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-500 hover:text-red-500'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              disabled={!user}
              title={user ? 'Like post' : 'Sign in to like posts'}
            >
              <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
              <span>{post.likes_count}</span>
            </button>

            <Link
              to={`/post/${post.slug}`}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Read more</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}