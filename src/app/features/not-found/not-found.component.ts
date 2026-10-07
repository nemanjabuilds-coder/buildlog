import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <img src="brand-mark.svg" alt="" width="42" height="42">
      <p class="eyebrow">404 / NOT IN THIS NOTEBOOK</p>
      <h1>This page wandered<br><em>off the map.</em></h1>
      <p>The link may have changed, or the project may not be public anymore.</p>
      <a class="btn btn-primary" routerLink="/login">Back to BuildLog</a>
    </main>
  `,
  styles: `
    :host { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .not-found { width: min(560px,100%); text-align: center; }
    img { border-radius: 11px; }
    .eyebrow { margin: 23px 0 10px; color: var(--coral); font: .65rem var(--mono); letter-spacing: .1em; }
    h1 { margin: 0; font: 400 clamp(2.8rem,7vw,4.2rem)/.98 Georgia,serif; letter-spacing: -.055em; }
    h1 em { color: var(--coral); font-weight: 400; }
    p:not(.eyebrow) { margin: 15px 0 22px; color: var(--ink-soft); font-size: .9rem; }
  `,
})
export class NotFoundComponent {}
