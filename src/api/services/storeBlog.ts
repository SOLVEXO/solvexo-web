import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Block } from './storefrontTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPostData {
  _id:         string;
  storeId:     string;
  title:       string;
  slug:        string;
  coverImage:  string | null;
  excerpt:     string;
  content:     Block[];
  status:      BlogPostStatus;
  publishedAt: string | null;
  tags:        string[];
  createdAt:   string;
  updatedAt:   string;
}

export interface BlogPostSummary {
  title:       string;
  slug:        string;
  coverImage:  string | null;
  excerpt:     string;
  tags:        string[];
  publishedAt: string | null;
}

export interface PaginatedBlogPosts {
  posts:      BlogPostSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ── Seller ───────────────────────────────────────────────────────────────────

export function apiListBlogPosts(storeId: string) {
  return client.get<never, ApiResponse<BlogPostData[]>>(ENDPOINTS.STORE_BLOG.LIST(storeId));
}

export function apiGetBlogPost(storeId: string, postId: string) {
  return client.get<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.GET(storeId, postId));
}

export function apiCreateBlogPost(storeId: string, payload: { title: string; slug: string; excerpt?: string; coverImage?: string }) {
  return client.post<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.CREATE(storeId), payload);
}

export function apiUpdateBlogPost(storeId: string, postId: string, payload: Partial<{ title: string; slug: string; excerpt: string; coverImage: string; tags: string[] }>) {
  return client.patch<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.UPDATE(storeId, postId), payload);
}

export function apiUpdateBlogContent(storeId: string, postId: string, content: Block[]) {
  return client.patch<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.UPDATE_CONTENT(storeId, postId), { content });
}

export function apiPublishBlogPost(storeId: string, postId: string) {
  return client.patch<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.PUBLISH(storeId, postId));
}

export function apiUnpublishBlogPost(storeId: string, postId: string) {
  return client.patch<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.UNPUBLISH(storeId, postId));
}

export function apiDeleteBlogPost(storeId: string, postId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_BLOG.DELETE(storeId, postId));
}

// ── Public ───────────────────────────────────────────────────────────────────

export function apiListPublicBlogPosts(storeId: string, page = 1, limit = 10) {
  return client.get<never, ApiResponse<PaginatedBlogPosts>>(`${ENDPOINTS.STORE_BLOG.PUBLIC_LIST(storeId)}?page=${page}&limit=${limit}`);
}

export function apiGetPublicBlogPost(storeId: string, slug: string) {
  return client.get<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.PUBLIC_POST(storeId, slug));
}
