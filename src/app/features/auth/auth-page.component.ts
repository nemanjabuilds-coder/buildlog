import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isSupabaseConfigured } from '../../core/config/runtime-config';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <div class="auth-topbar">
        <a class="brand" routerLink="/login"><img src="brand-mark.svg" alt="" width="40" height="40"><strong>BuildLog</strong></a>
        <span class="top-note">A LITTLE SPACE FOR THE WORK IN BETWEEN</span>
      </div>
      <div class="auth-layout">
        <section class="story-panel">
          <p class="eyebrow">A FIELD GUIDE TO FIGURING IT OUT</p>
          <h1>Make room<br>for <em>the learning.</em></h1>
          <p class="story-copy">The small projects. The stubborn bugs. The moment it finally clicks. Keep a record of all of it.</p>
          <div class="story-mark" aria-hidden="true">
            <span class="story-page page-back"></span><span class="story-page page-front"><i></i><i></i><i></i><b></b></span><span class="story-waypoint"></span>
          </div>
          <div class="story-caption"><span>01 / KEEP GOING</span><span>NOTES FROM THE BUILD</span></div>
        </section>

        <section class="auth-card surface" aria-labelledby="form-heading">
          <p class="eyebrow">YOUR WORKSPACE</p>
          <h2 id="form-heading">{{ isSignup ? 'Start your notebook.' : 'Pick up where you left off.' }}</h2>
          <p class="form-intro">{{ isSignup ? 'One account for every project you are learning through.' : 'Sign in to your learning studio.' }}</p>

          @if (!configured) {
            <div class="notice setup-notice" role="status"><span aria-hidden="true">i</span><span><strong>One last setup step.</strong> Connect a Supabase project to enable email sign-in and save your work. The app is wired for Supabase; its database setup is included in the project.</span></div>
          }
          @if (notice()) {
            <div class="notice" [class.notice-error]="notice()?.kind === 'error'" [class.notice-success]="notice()?.kind === 'success'" role="status">{{ notice()?.text }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label for="email">Email address</label>
              <input id="email" type="email" autocomplete="email" placeholder="you@example.com" formControlName="email" [attr.aria-invalid]="form.controls.email.invalid && form.controls.email.touched">
              @if (form.controls.email.touched && form.controls.email.invalid) { <small class="field-error">Enter a valid email address.</small> }
            </div>
            <div class="field">
              <label for="password">Password</label>
              <input id="password" type="password" [autocomplete]="isSignup ? 'new-password' : 'current-password'" placeholder="At least 8 characters" formControlName="password" [attr.aria-invalid]="form.controls.password.invalid && form.controls.password.touched">
              @if (form.controls.password.touched && form.controls.password.invalid) { <small class="field-error">Use at least 8 characters.</small> }
            </div>
            @if (isSignup) {
              <div class="field">
                <label for="confirm-password">Confirm password</label>
                <input id="confirm-password" type="password" autocomplete="new-password" placeholder="Type it again" formControlName="confirmPassword">
              </div>
            }
            <button class="btn btn-accent submit-btn" type="submit" [disabled]="submitting() || !configured">
              @if (submitting()) { <span class="spinner" aria-hidden="true"></span> } {{ submitting() ? 'One moment…' : (isSignup ? 'Create your account' : 'Sign in') }} <span aria-hidden="true">↗</span>
            </button>
          </form>

          <p class="switch-mode">{{ isSignup ? 'Already have a notebook?' : 'New to BuildLog?' }}
            <a [routerLink]="isSignup ? '/login' : '/signup'">{{ isSignup ? 'Sign in' : 'Create an account' }}</a>
          </p>
          <div class="privacy-note"><span aria-hidden="true">◌</span> Your private projects stay yours. Only projects you explicitly publish can be viewed by others.</div>
        </section>
      </div>
      <footer class="auth-footer"><span>BUILDLOG / LEARNING, MADE VISIBLE.</span><span>Built one step at a time.</span></footer>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100vh; }
    .auth-page { min-height: 100vh; padding: 0 5.2vw; background: var(--paper); }
    .auth-topbar { height: 76px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); }
    .brand { display: inline-flex; align-items: center; gap: 10px; color: var(--ink); font-size: 1.08rem; letter-spacing: -.035em; }
    .brand img { border-radius: 10px; }
    .top-note { color: #929991; font: .59rem var(--mono); letter-spacing: .08em; }
    .auth-layout { max-width: 1110px; min-height: calc(100vh - 138px); display: grid; grid-template-columns: minmax(0,1fr) minmax(390px,450px); align-items: center; gap: clamp(35px,8vw,125px); margin: 0 auto; padding: 50px 0; }
    .story-panel { position: relative; min-height: 400px; display: flex; flex-direction: column; justify-content: center; padding: 15px 0 75px; }
    .story-panel .eyebrow { margin: 0 0 16px; }
    h1 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(3.25rem,6.2vw,5.4rem); font-weight: 400; letter-spacing: -.06em; line-height: .94; }
    h1 em { color: var(--coral); font-weight: 400; }
    .story-copy { max-width: 410px; margin: 23px 0 0; color: var(--ink-soft); font-size: 1rem; line-height: 1.7; }
    .story-mark { position: absolute; right: 7%; bottom: 10px; width: 190px; height: 132px; }
    .story-page { position: absolute; width: 132px; height: 95px; border: 1px solid #c9c8bb; border-radius: 7px; }
    .page-back { top: 12px; left: 16px; transform: rotate(-8deg); background: #e9e7dc; }
    .page-front { top: 22px; left: 35px; display: grid; align-content: center; gap: 11px; padding: 15px 20px; transform: rotate(4deg); background: #fffdf8; box-shadow: 0 8px 20px rgb(38 53 47 / 8%); }
    .page-front i { width: 77px; height: 1px; background: #d9d8cf; }
    .page-front i:first-child { width: 52px; background: #d88f7e; }
    .page-front b { position: absolute; right: 20px; bottom: 19px; width: 9px; height: 9px; border: 3px solid #fffdf8; border-radius: 50%; background: var(--coral); box-shadow: 0 0 0 1px var(--coral); }
    .story-waypoint { position: absolute; top: 15px; right: 14px; width: 11px; height: 11px; border-radius: 50%; background: var(--coral); box-shadow: 0 0 0 5px var(--coral-soft); }
    .story-caption { position: absolute; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 12px; color: #919991; font: .57rem var(--mono); letter-spacing: .08em; }
    .auth-card { padding: 33px 34px 27px; box-shadow: var(--shadow); }
    .auth-card .eyebrow { margin: 0 0 10px; }
    .auth-card h2 { margin: 0; font-family: Georgia, serif; font-size: 1.8rem; font-weight: 400; letter-spacing: -.04em; line-height: 1.12; }
    .form-intro { margin: 9px 0 23px; color: var(--ink-soft); font-size: .84rem; line-height: 1.5; }
    .setup-notice { margin-bottom: 16px; }
    .setup-notice strong { display: block; margin-bottom: 2px; }
    form { display: grid; gap: 16px; }
    .submit-btn { width: 100%; margin-top: 3px; }
    .switch-mode { margin: 19px 0 0; color: var(--ink-soft); text-align: center; font-size: .78rem; }
    .switch-mode a { margin-left: 4px; color: var(--coral); font-weight: 700; }
    .privacy-note { display: flex; gap: 8px; margin-top: 23px; padding-top: 16px; border-top: 1px solid var(--line); color: #888f89; font-size: .69rem; line-height: 1.45; }
    .privacy-note span { color: var(--fern); font-size: .94rem; }
    .auth-footer { max-width: 1110px; min-height: 62px; display: flex; justify-content: space-between; gap: 12px; margin: 0 auto; border-top: 1px solid var(--line); color: #8e968e; font-size: .67rem; }
    .auth-footer span:first-child { padding-top: 17px; font: .57rem var(--mono); letter-spacing: .08em; }
    .auth-footer span:last-child { padding-top: 17px; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgb(255 255 255 / 45%); border-top-color: white; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media(max-width: 900px) { .auth-layout { grid-template-columns: minmax(0,1fr) minmax(350px,420px); gap: 36px; } .story-mark { opacity: .6; } }
    @media(max-width: 720px) { .auth-page { padding: 0 20px; } .auth-topbar { height: 64px; } .top-note { display: none; } .auth-layout { min-height: auto; grid-template-columns: 1fr; gap: 28px; padding: 36px 0 40px; } .story-panel { min-height: 0; padding: 0 0 10px; } h1 { font-size: 3.45rem; } .story-copy { max-width: 430px; margin-top: 15px; font-size: .91rem; } .story-mark { display: none; } .story-caption { display: none; } .auth-card { padding: 26px 21px 22px; } .auth-footer { min-height: 56px; } }
  `,
})
export class AuthPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly isSignup = this.route.snapshot.data['mode'] === 'signup';
  readonly configured = isSupabaseConfigured();
  readonly submitting = signal(false);
  readonly notice = signal<{ kind: 'error' | 'success'; text: string } | null>(null);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: [''],
  });

  async submit(): Promise<void> {
    this.notice.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { email, password, confirmPassword } = this.form.getRawValue();
    if (this.isSignup && password !== confirmPassword) {
      this.notice.set({ kind: 'error', text: 'Those passwords do not match yet.' });
      return;
    }
    if (!this.configured) {
      this.notice.set({ kind: 'error', text: 'Supabase is not configured. Add your project URL and anon key to enable authentication.' });
      return;
    }

    this.submitting.set(true);
    try {
      const result = this.isSignup
        ? await this.auth.signUp(email.trim(), password)
        : await this.auth.signIn(email.trim(), password);
      if (result.error) {
        this.notice.set({ kind: 'error', text: result.error });
      } else if (this.isSignup && result.emailConfirmationRequired) {
        this.notice.set({ kind: 'success', text: 'Check your inbox to confirm your email, then come back here to sign in.' });
        this.form.controls.password.reset();
        this.form.controls.confirmPassword.reset();
      } else {
        await this.router.navigateByUrl('/dashboard');
      }
    } catch (error: unknown) {
      this.notice.set({ kind: 'error', text: error instanceof Error ? error.message : 'That did not work. Please try again.' });
    } finally {
      this.submitting.set(false);
    }
  }
}
