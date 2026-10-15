import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, LogOut } from 'lucide-react';
import { TokenStorage } from '@/api/services/auth';
import { useLogout } from '@/hooks/auth/useLogout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';

/**
 * Standalone page at `/access-denied?store=<id>`. A signed-in account that
 * opens a store it does not own (or work for) is sent here by
 * `StoreWorkspaceProvider`, so the URL itself shows the wrong store was hit and
 * none of that store's workspace is rendered. The backend stays the real
 * enforcement; this is the matching UX.
 *
 * Same frame as the plan gate (`OnboardingPlansPage`): dark top bar with the
 * real logo, cream sheet with rounded top. Flat: no card, no shadows.
 */
export function StoreAccessDenied() {
  usePageTitle('Access restricted');
  const navigate = useNavigate();
  const logout = useLogout();
  const [params] = useSearchParams();
  const storeId = (params.get('store') ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  const me = TokenStorage.getUser<{ name?: string; email?: string }>();
  const who = me?.email || me?.name || null;

  return (
    <div className="fixed inset-0 bg-carbon">
      <div className="h-16 px-6 md:px-8 flex items-center">
        <SolvexoLogo size={32} variant="light" />
      </div>

      <div className="absolute inset-x-0 top-16 bottom-0 bg-cream rounded-t-[28px] overflow-y-auto flex items-center justify-center px-6 py-16">
        <motion.section
          role="alert"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[560px] text-center"
        >
          <p className="text-[12px] font-semibold tracking-[0.16em] uppercase text-brand-orange mb-5">
            Error 403 · Access restricted
          </p>

          <h1 className="text-[32px] sm:text-[44px] font-bold leading-[1.1] tracking-tight text-carbon mb-5">
            You don't have access to this store
          </h1>

          <p className="text-[16px] leading-[1.7] text-slate mb-10 mx-auto max-w-[460px]">
            This store belongs to a different account. Ask its owner to invite you as a team member,
            or sign in with the account that has access.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/seller', { replace: true })}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold text-white bg-brand-orange hover:bg-brand-deep-orange transition-colors duration-200 cursor-pointer border-0"
            >
              Go to my stores <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => logout('/login')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-carbon bg-white border border-bone hover:bg-bone transition-colors duration-200 cursor-pointer"
            >
              <LogOut size={16} aria-hidden="true" /> Sign in with another account
            </button>
          </div>

          {(who || storeId) && (
            <p className="mt-12 pt-6 border-t border-bone text-[13px] leading-[1.8] text-slate break-words">
              {who && <>Signed in as <span className="text-carbon font-medium">{who}</span></>}
              {who && storeId && <span aria-hidden="true"> · </span>}
              {storeId && <>Store ID <span className="font-mono text-carbon">{storeId}</span></>}
            </p>
          )}
        </motion.section>
      </div>
    </div>
  );
}

export default StoreAccessDenied;
