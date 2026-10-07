import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isSupabaseConfigured } from '../config/runtime-config';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!isSupabaseConfigured()) {
    return router.createUrlTree(['/login'], { queryParams: { setup: 'supabase', next: state.url } });
  }

  await auth.whenReady();
  return auth.user() ? true : router.createUrlTree(['/login']);
};
