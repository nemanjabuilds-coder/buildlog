import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth-page.component').then((module) => module.AuthPageComponent),
    data: { mode: 'login' },
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/auth-page.component').then((module) => module.AuthPageComponent),
    data: { mode: 'signup' },
  },
  {
    path: 'portfolio/:slug',
    loadComponent: () => import('./features/portfolio/portfolio.component').then((module) => module.PortfolioComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((module) => module.DashboardComponent) },
      { path: 'projects/new', loadComponent: () => import('./features/projects/project-editor.component').then((module) => module.ProjectEditorComponent) },
      { path: 'projects/:id/edit', loadComponent: () => import('./features/projects/project-editor.component').then((module) => module.ProjectEditorComponent) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/project-detail.component').then((module) => module.ProjectDetailComponent) },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((module) => module.NotFoundComponent),
  },
];
