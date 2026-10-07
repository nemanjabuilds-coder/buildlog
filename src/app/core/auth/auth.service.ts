import { Injectable, signal } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '../data/supabase-client';

export interface AuthActionResult {
  error: string | null;
  emailConfirmationRequired?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = supabaseClient;
  readonly user = signal<User | null>(null);
  readonly ready = signal(false);
  readonly sessionError = signal<string | null>(null);
  private readonly readyPromise: Promise<void>;

  constructor() {
    if (!this.client) {
      this.ready.set(true);
      this.readyPromise = Promise.resolve();
      return;
    }

    this.client.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
      this.ready.set(true);
    });

    this.readyPromise = this.client.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) this.sessionError.set(error.message);
        this.user.set(data.session?.user ?? null);
        this.ready.set(true);
      })
      .catch((error: unknown) => {
        this.sessionError.set(error instanceof Error ? error.message : 'Could not restore your session.');
        this.ready.set(true);
      });
  }

  async whenReady(): Promise<void> {
    await this.readyPromise;
  }

  async signIn(email: string, password: string): Promise<AuthActionResult> {
    if (!this.client) return { error: 'Connect a Supabase project before signing in.' };
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async signUp(email: string, password: string): Promise<AuthActionResult> {
    if (!this.client) return { error: 'Connect a Supabase project before creating an account.' };
    const { data, error } = await this.client.auth.signUp({ email, password });
    return {
      error: error?.message ?? null,
      emailConfirmationRequired: !error && !data.session,
    };
  }

  async signOut(): Promise<AuthActionResult> {
    if (!this.client) return { error: 'Supabase is not configured.' };
    const { error } = await this.client.auth.signOut();
    return { error: error?.message ?? null };
  }
}
