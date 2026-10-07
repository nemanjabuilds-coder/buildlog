import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="workspace">
      <aside class="rail" aria-label="Main navigation">
        <a class="brand" routerLink="/dashboard" aria-label="BuildLog dashboard">
          <img src="brand-mark.svg" alt="" width="40" height="40">
          <span class="brand-copy"><strong>BuildLog</strong><small>LEARNING STUDIO</small></span>
        </a>

        <div class="rail-label">YOUR WORKSPACE</div>
        <nav class="rail-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="3" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><path d="M12 14.5h5M14.5 12v5"/></svg>
            <span>Projects</span>
            <span class="nav-arrow" aria-hidden="true">↗</span>
          </a>
          <a class="rail-link-muted" routerLink="/dashboard" fragment="activity">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4h12M4 8h12M4 12h8M4 16h6"/></svg>
            <span>Learning log</span>
          </a>
        </nav>

        <div class="rail-note">
          <span class="note-mark" aria-hidden="true">✳</span>
          <p>Small steps<br><strong>add up.</strong></p>
          <span class="note-rule"></span>
          <small>KEEP BUILDING</small>
        </div>

        <div class="rail-footer">
          <div class="avatar" aria-hidden="true">{{ initials }}</div>
          <div class="user-copy"><strong>{{ displayName }}</strong><small>{{ email }}</small></div>
          <button type="button" class="logout" aria-label="Sign out" title="Sign out" (click)="signOut()">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 3H4.8A1.8 1.8 0 0 0 3 4.8v10.4A1.8 1.8 0 0 0 4.8 17H8M12 6l4 4-4 4M7 10h9"/></svg>
          </button>
        </div>
        @if (signOutError()) { <p class="signout-error" role="alert">{{ signOutError() }}</p> }
      </aside>

      <div class="main-column">
        <header class="mobile-header">
          <a class="brand mobile-brand" routerLink="/dashboard"><img src="brand-mark.svg" alt="" width="34" height="34"><strong>BuildLog</strong></a>
          <nav aria-label="Mobile navigation"><a routerLink="/dashboard">Projects</a><button type="button" (click)="signOut()">Sign out</button></nav>
        </header>
        <div class="topline"><span class="topline-dot"></span><span>YOUR LEARNING, IN MOTION</span><span class="topline-date">A record of the work behind the work</span></div>
        <main class="page-content"><router-outlet /></main>
        <footer class="page-footer"><span>BUILDLOG / KEEP THE RECEIPTS.</span><span>Made one step at a time.</span></footer>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100vh; }
    .workspace { min-height: 100vh; display: grid; grid-template-columns: 242px minmax(0, 1fr); }
    .rail { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 28px 18px 18px; color: #f5f2eb; background: #26352f; }
    .brand { display: flex; align-items: center; gap: 10px; min-width: 0; color: inherit; }
    .brand img { flex: 0 0 auto; border-radius: 10px; }
    .brand-copy { display: grid; gap: 3px; }
    .brand-copy strong { font-size: 1.05rem; letter-spacing: -.04em; }
    .brand-copy small, .rail-label, .rail-note small { color: #aebbb2; font-family: var(--mono); font-size: .6rem; letter-spacing: .12em; }
    .rail-label { margin: 48px 0 13px 10px; }
    .rail-nav { display: grid; gap: 5px; }
    .rail-nav a { min-height: 46px; display: flex; align-items: center; gap: 11px; padding: 0 11px; border-radius: 7px; color: #d4ddd6; font-size: .87rem; transition: background 160ms ease, color 160ms ease; }
    .rail-nav a:hover { color: white; background: rgb(255 255 255 / 7%); }
    .rail-nav a.active { color: #fffaf5; background: rgb(255 255 255 / 12%); }
    .rail-nav svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .nav-arrow { margin-left: auto; color: #e68a72; font-size: .85rem; }
    .rail-link-muted { opacity: .76; }
    .rail-note { position: relative; margin: auto 4px 22px; padding: 18px 15px 15px; border: 1px solid rgb(255 255 255 / 13%); border-radius: 8px; background: rgb(255 255 255 / 4%); }
    .note-mark { color: #e68a72; font-size: 1.25rem; }
    .rail-note p { margin: 9px 0 16px; font-family: Georgia, serif; font-size: 1.2rem; line-height: 1.18; }
    .rail-note p strong { color: #e68a72; font-weight: 400; font-style: italic; }
    .note-rule { display: block; width: 30px; height: 1px; margin-bottom: 10px; background: #e68a72; }
    .rail-note small { font-size: .55rem; }
    .rail-footer { display: flex; align-items: center; gap: 10px; padding: 14px 2px 2px; border-top: 1px solid rgb(255 255 255 / 13%); }
    .avatar { width: 34px; height: 34px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 50%; color: #26352f; background: #e9b8a6; font-size: .68rem; font-weight: 700; }
    .user-copy { display: grid; gap: 3px; min-width: 0; flex: 1; }
    .user-copy strong { overflow: hidden; color: #f7f6ef; font-size: .77rem; text-overflow: ellipsis; white-space: nowrap; }
    .user-copy small { overflow: hidden; color: #aebbb2; font-size: .67rem; text-overflow: ellipsis; white-space: nowrap; }
    .logout { width: 32px; height: 32px; display: grid; place-items: center; border: 0; border-radius: 6px; color: #c2cec6; background: transparent; cursor: pointer; }
    .logout:hover { color: #fff; background: rgb(255 255 255 / 10%); }
    .logout svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .signout-error { margin: 9px 0 0; color: #f2b5a7; font-size: .72rem; }
    .main-column { min-width: 0; padding: 0 42px; }
    .topline { min-height: 61px; display: flex; align-items: center; gap: 9px; border-bottom: 1px solid var(--line); color: var(--ink-soft); font-family: var(--mono); font-size: .62rem; letter-spacing: .08em; }
    .topline-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--fern); box-shadow: 0 0 0 3px var(--fern-soft); }
    .topline-date { margin-left: auto; font-family: var(--sans); font-size: .75rem; letter-spacing: 0; }
    .page-content { max-width: 1120px; min-height: calc(100vh - 112px); margin: 0 auto; padding: 42px 0 36px; }
    .page-footer { min-height: 50px; display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid var(--line); color: #8c958e; font-size: .69rem; }
    .page-footer span:first-child { padding-top: 16px; font-family: var(--mono); letter-spacing: .08em; }
    .page-footer span:last-child { padding-top: 16px; }
    .mobile-header { display: none; }
    @media (max-width: 1000px) { .workspace { grid-template-columns: 210px minmax(0,1fr); } .main-column { padding: 0 28px; } }
    @media (max-width: 720px) {
      .workspace { display: block; }
      .rail { display: none; }
      .mobile-header { min-height: 63px; display: flex; align-items: center; justify-content: space-between; padding: 0 19px; border-bottom: 1px solid var(--line); background: var(--paper-strong); }
      .mobile-brand { color: var(--ink); font-size: .96rem; }
      .mobile-brand img { border-radius: 8px; }
      .mobile-header nav { display: flex; align-items: center; gap: 15px; font-size: .78rem; }
      .mobile-header nav button { padding: 7px 9px; border: 1px solid var(--line); border-radius: 6px; background: transparent; }
      .topline { min-height: 45px; padding: 0 19px; font-size: .56rem; }
      .topline-date { display: none; }
      .main-column { padding: 0 19px; }
      .page-content { min-height: calc(100vh - 160px); padding: 30px 0 28px; }
      .page-footer { font-size: .62rem; }
    }
  `,
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly signOutError = signal('');
  readonly email = this.auth.user()?.email ?? 'Signed in';
  readonly displayName = this.auth.user()?.user_metadata?.['name'] ?? this.email.split('@')[0] ?? 'Builder';
  readonly initials = this.displayName.slice(0, 2).toUpperCase();

  async signOut(): Promise<void> {
    this.signOutError.set('');
    const result = await this.auth.signOut();
    if (result.error) {
      this.signOutError.set(result.error);
      return;
    }
    await this.router.navigateByUrl('/login');
  }
}
