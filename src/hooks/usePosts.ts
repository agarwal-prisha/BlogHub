import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  author_id: string;
  category_id: string | null;
  tags: string[];
  slug: string;
  published: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  categories: {
    name: string;
    slug: string;
  } | null;
  user_liked?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async (searchQuery?: string, categorySlug?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (full_name, email, avatar_url),
          categories (name, slug)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      if (categorySlug) {
        query = query.eq('categories.slug', categorySlug);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPostBySlug = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (full_name, email, avatar_url),
          categories (name, slug)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  };

  const createPost = async (postData: {
    title: string;
    content: string;
    excerpt: string;
    category_id: string | null;
    tags: string[];
  }) => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be signed in to create a post');
      }

      const slug = postData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      const insertData = {
        ...postData,
        slug,
        author_id: user.id,
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      await fetchPosts();
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const updatePost = async (id: string, updates: Partial<Post>) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userData.user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        await supabase
          .from('post_likes')
          .insert([
            {
              post_id: postId,
              user_id: userData.user.id,
            },
          ]);
      }

      await fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };

  return {
    posts,
    categories,
    loading,
    error,
    fetchPosts,
    fetchPostBySlug,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
  };
}