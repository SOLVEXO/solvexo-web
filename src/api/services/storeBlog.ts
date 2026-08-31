import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Block } from './storefrontTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type BlogPostStatus = 'draft' | 'scheduled' | 'published';

export interface BlogPostData {
  _id:         string;
  storeId:     string;
  blogId:      string | null;
  title:       string;
  slug:        string;
  coverImage:  string | null;
  excerpt:     string;
  content:     Block[];
  status:      BlogPostStatus;
  publishedAt: string | null;
  /** Set only while `status === 'scheduled'` — the future date it will go live, via a minute-tick backend cron (see SchedulerService#publishScheduledBlogPosts). */
  scheduledAt: string | null;
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
  blog:       { title: string; slug: string };
  posts:      BlogPostSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface BlogData {
  _id: string;
  storeId: string;
  title: string;
  slug: string;
  commentsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BlogCommentStatus = 'pending' | 'approved' | 'spam';

export interface BlogCommentData {
  _id: string;
  storeId: string;
  blogPostId: string;
  authorName: string;
  authorEmail: string;
  body: string;
  status: BlogCommentStatus;
  createdAt: string;
}

// ── Blogs ────────────────────────────────────────────────────────────────────

export function apiListBlogs(storeId: string) {
  return client.get<never, ApiResponse<BlogData[]>>(ENDPOINTS.STORE_BLOG.BLOGS_LIST_CREATE(storeId));
}

export function apiCreateBlog(storeId: string, payload: { title: string; commentsEnabled?: boolean }) {
  return client.post<never, ApiResponse<BlogData>>(ENDPOINTS.STORE_BLOG.BLOGS_LIST_CREATE(storeId), payload);
}

export function apiUpdateBlog(storeId: string, blogId: string, payload: Partial<{ title: string; commentsEnabled: boolean }>) {
  return client.patch<never, ApiResponse<BlogData>>(ENDPOINTS.STORE_BLOG.BLOG_UPDATE_DELETE(storeId, blogId), payload);
}

export function apiDeleteBlog(storeId: string, blogId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_BLOG.BLOG_UPDATE_DELETE(storeId, blogId));
}

// ── Seller — posts ───────────────────────────────────────────────────────────

export function apiListBlogPosts(storeId: string, blogId?: string) {
  return client.get<never, ApiResponse<BlogPostData[]>>(ENDPOINTS.STORE_BLOG.LIST(storeId, blogId));
}

export function apiGetBlogPost(storeId: string, postId: string) {
  return client.get<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.GET(storeId, postId));
}

export function apiCreateBlogPost(storeId: string, payload: { title: string; slug: string; excerpt?: string; coverImage?: string; blogId?: string }) {
  return client.post<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.CREATE(storeId), payload);
}

export function apiUpdateBlogPost(storeId: string, postId: string, payload: Partial<{ title: string; slug: string; excerpt: string; coverImage: string; tags: string[] }>) {
  return client.patch<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.UPDATE(storeId, postId), payload);
}

export function apiUpdateBlogContent(storeId: string, postId: string, content: Block[]) {
  return client.patch<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.UPDATE_CONTENT(storeId, postId), { content });
}

/** Omit `scheduledAt` (or pass a past date) to publish immediately, same as before — pass a future ISO date to schedule it instead. */
export function apiPublishBlogPost(storeId: string, postId: string, scheduledAt?: string | null) {
  return client.patch<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.PUBLISH(storeId, postId), scheduledAt ? { scheduledAt } : undefined);
}

export function apiUnpublishBlogPost(storeId: string, postId: string) {
  return client.patch<never, ApiResponse<BlogPostData>>(ENDPOINTS.STORE_BLOG.UNPUBLISH(storeId, postId));
}

export function apiDeleteBlogPost(storeId: string, postId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_BLOG.DELETE(storeId, postId));
}

// ── Seller — comment moderation ─────────────────────────────────────────────

export function apiListBlogComments(storeId: string, status?: BlogCommentStatus) {
  return client.get<never, ApiResponse<BlogCommentData[]>>(ENDPOINTS.STORE_BLOG.COMMENTS_LIST(storeId, status));
}

export function apiModerateBlogComment(storeId: string, commentId: string, status: BlogCommentStatus) {
  return client.patch<never, ApiResponse<BlogCommentData>>(ENDPOINTS.STORE_BLOG.COMMENT_MODERATE_DELETE(storeId, commentId), { status });
}

export function apiDeleteBlogComment(storeId: string, commentId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.STORE_BLOG.COMMENT_MODERATE_DELETE(storeId, commentId));
}

// ── Public ───────────────────────────────────────────────────────────────────

export function apiListPublicBlogPosts(storeId: string, blogSlug?: string, page = 1, limit = 10) {
  const base = ENDPOINTS.STORE_BLOG.PUBLIC_LIST(storeId, blogSlug);
  const sep = base.includes('?') ? '&' : '?';
  return client.get<never, ApiResponse<PaginatedBlogPosts>>(`${base}${sep}page=${page}&limit=${limit}`);
}

export function apiGetPublicBlogPost(storeId: string, slug: string) {
  return client.get<never, ApiResponse<BlogPostData & { commentsEnabled: boolean }>>(ENDPOINTS.STORE_BLOG.PUBLIC_POST(storeId, slug));
}

export function apiListPublicBlogComments(storeId: string, postId: string) {
  return client.get<never, ApiResponse<{ authorName: string; body: string; createdAt: string }[]>>(ENDPOINTS.STORE_BLOG.PUBLIC_COMMENTS(storeId, postId));
}

export function apiSubmitPublicBlogComment(storeId: string, postId: string, payload: { authorName: string; authorEmail: string; body: string }) {
  return client.post<never, ApiResponse<{ status: string }>>(ENDPOINTS.STORE_BLOG.PUBLIC_COMMENTS(storeId, postId), payload);
}
