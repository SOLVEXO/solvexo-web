import client from '../client';

export interface CourseSummary { courseId: string; title: string; description: string; lessons: number; done: number; completed: boolean }
export interface LessonView {
  id: string; title: string; type: 'video' | 'file' | 'text' | 'quiz'; locked: boolean; unlockAt: string | null; completed: boolean; score: number | null;
  text?: string; fileName?: string; quiz?: { passScore: number; questions: { q: string; options: string[] }[] };
}
export interface CourseOutline {
  courseId: string; title: string; description: string; completed: boolean; certificateId: string | null;
  modules: { id: string; title: string; lessons: LessonView[] }[];
}

const ME = '/api/courses/me';
const p = (storeId: string) => ({ params: { storeId } });

export const apiMyCourses = (storeId: string) => client.get(ME, p(storeId)) as Promise<CourseSummary[]>;
export const apiCourseOutline = (storeId: string, courseId: string) => client.get(`${ME}/${courseId}`, p(storeId)) as Promise<CourseOutline>;
export const apiLessonMedia = (storeId: string, courseId: string, lessonId: string) =>
  client.post(`${ME}/${courseId}/lessons/${lessonId}/media`, {}, p(storeId)) as Promise<{ url: string }>;
export const apiCompleteLesson = (storeId: string, courseId: string, lessonId: string) =>
  client.post(`${ME}/${courseId}/lessons/${lessonId}/complete`, {}, p(storeId)) as Promise<{ completed: boolean; certificateId: string | null }>;
export const apiSubmitQuiz = (storeId: string, courseId: string, lessonId: string, answers: number[]) =>
  client.post(`${ME}/${courseId}/lessons/${lessonId}/quiz`, { answers }, p(storeId)) as Promise<{ score: number; passed: boolean; completed?: boolean }>;

/** The certificate needs the login token, so it is fetched as a file and opened from a blob URL. */
export async function apiOpenCertificate(storeId: string, courseId: string): Promise<void> {
  const blob = (await client.get(`${ME}/${courseId}/certificate`, { ...p(storeId), responseType: 'blob' })) as unknown as Blob;
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
