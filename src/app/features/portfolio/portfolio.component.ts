import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isSupabaseConfigured } from '../../core/config/runtime-config';
import { ProjectsService } from '../../core/data/projects.service';
import { ProjectStatus, PublicPortfolioData } from '../../core/models/database.types';

@Component({
  selector: 'app-portfolio',
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <main class="portfolio-page">
      <header class="public-header"><a class="brand" routerLink="/login"><img src="brand-mark.svg" width="38" height="38" alt=""><strong>BuildLog</strong></a><span class="public-label"><span></span> A PUBLIC PROJECT NOTE</span></header>
      @if (loading()) {
        <section class="portfolio-state surface"><span class="state-mark shimmer-mark"></span><p class="eyebrow">OPENING A PROJECT NOTE</p><div class="skeleton"></div><div class="skeleton short"></div></section>
      } @else if (error()) {
        <section class="portfolio-state surface"><span class="state-mark" aria-hidden="true">↗</span><p class="eyebrow">COULDN'T OPEN THIS PAGE</p><h1>The project note is unavailable.</h1><p>{{ error() }}</p><a class="btn btn-quiet" routerLink="/login">Go to BuildLog</a></section>
      } @else if (!data()) {
        <section class="portfolio-state surface"><span class="state-mark" aria-hidden="true">⌕</span><p class="eyebrow">NOT IN THE PUBLIC NOTEBOOK</p><h1>This page isn't available.</h1><p>The link may be incorrect, or the owner may have made this project private.</p><a class="btn btn-quiet" routerLink="/login">Go to BuildLog</a></section>
      } @else {
        <article class="portfolio-content">
          <div class="portfolio-kicker"><span class="waypoint"></span><span>LEARNING PROJECT / {{ data()!.project.created_at | date:'MMMM y' }}</span><span class="kicker-line"></span><span class="status">{{ statusLabel(data()!.project.status) }}</span></div>
          <h1>{{ data()!.project.title }}<span class="title-period">.</span></h1>
          <p class="lead">{{ data()!.project.description || 'A project in the making — and the learning that came with it.' }}</p>
          <div class="tag-row">@for (tag of data()!.project.technology_tags; track tag) { <span class="tag">{{ tag }}</span> }</div>

          <section class="progress-section">
            <div class="progress-heading"><div><p class="eyebrow">A MEASURE OF THE JOURNEY</p><h2>In progress</h2></div><strong>{{ data()!.project.progress }}<small>%</small></strong></div>
            <div class="progress-track"><span [style.width.%]="data()!.project.progress"></span></div>
            <div class="progress-foot"><span>FIRST COMMIT</span><span>{{ data()!.project.progress >= 100 ? 'CIRCLE COMPLETE' : 'NEXT SMALL STEP' }}</span></div>
          </section>

          <div class="story-grid">
            <section class="story-block"><p class="eyebrow">THE INTENTION</p><h2>What I set out to learn</h2><p>{{ data()!.project.goals || 'Learning goals are still taking shape.' }}</p></section>
            <section class="story-block project-links"><p class="eyebrow">FOLLOW THE WORK</p><h2>Where to find it</h2>
              @if (data()!.project.repository_url) { <a [href]="data()!.project.repository_url" target="_blank" rel="noopener noreferrer">View repository <span aria-hidden="true">↗</span></a> }
              @if (data()!.project.demo_url) { <a [href]="data()!.project.demo_url" target="_blank" rel="noopener noreferrer">Open live demo <span aria-hidden="true">↗</span></a> }
              @if (!data()!.project.repository_url && !data()!.project.demo_url) { <p>Links will appear here when the work is ready to share.</p> }
            </section>
          </div>

          <section class="timeline-section">
            <div class="section-heading"><div><p class="eyebrow">THE SMALL WINS ADD UP</p><h2>Milestones</h2></div><span class="section-count">{{ data()!.milestones.length }} NOTES</span></div>
            @if (data()!.milestones.length === 0) { <p class="muted empty-line">No public milestones have been added yet.</p> }
            <div class="timeline">@for (milestone of data()!.milestones; track $index) {
              <div class="timeline-item"><span class="timeline-dot" [class.complete]="milestone.is_complete"></span><div class="timeline-copy"><strong>{{ milestone.title }}</strong>@if (milestone.notes) { <p>{{ milestone.notes }}</p> }@if (milestone.due_date) { <small>{{ milestone.due_date | date:'MMM d, y' }}</small> }</div><span class="timeline-state">{{ milestone.is_complete ? 'DONE' : 'NEXT' }}</span></div>
            }</div>
          </section>

          <section class="learning-section">
            <div class="section-heading"><div><p class="eyebrow">NOT JUST WHAT SHIPPED</p><h2>Things I learned</h2></div><span class="section-count">{{ data()!.entries.length }} NOTES</span></div>
            @if (data()!.entries.length === 0) { <p class="muted empty-line">Public learning notes will show up here when they are ready.</p> }
            <div class="learning-list">@for (entry of data()!.entries; track $index) {
              <article class="learning-card"><div class="entry-meta"><span [class]="'entry-kind ' + entry.kind">{{ kindLabel(entry.kind) }}</span><time>{{ entry.created_at | date:'MMM d, y' }}</time></div><h3>{{ entry.title }}</h3><p>{{ entry.body }}</p></article>
            }</div>
          </section>
          <footer class="portfolio-footer"><span>BUILDLOG / LEARNING, MADE VISIBLE.</span><span>Shared with care.</span></footer>
        </article>
      }
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100vh; }
    .portfolio-page { min-height: 100vh; padding: 0 5vw 35px; }
    .public-header { height: 70px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: 9px; font-size: .98rem; letter-spacing: -.035em; }
    .brand img { border-radius: 9px; }
    .public-label { display: flex; align-items: center; gap: 8px; color: #8a938a; font: .59rem var(--mono); letter-spacing: .08em; }
    .public-label span { width: 7px; height: 7px; border-radius: 50%; background: var(--fern); }
    .portfolio-content { max-width: 850px; margin: 0 auto; padding: 61px 0 0; }
    .portfolio-kicker { display: flex; align-items: center; gap: 9px; color: #929991; font: .6rem var(--mono); letter-spacing: .08em; }
    .waypoint { width: 7px; height: 7px; border-radius: 50%; background: var(--coral); box-shadow: 0 0 0 3px var(--coral-soft); }
    .kicker-line { width: 34px; height: 1px; margin: 0 3px; background: var(--line); }
    .status { color: var(--fern); }
    h1 { margin: 17px 0 0; font: 400 clamp(3.25rem,8.1vw,6.1rem)/.95 Georgia,serif; letter-spacing: -.065em; }
    .title-period { color: var(--coral); }
    .lead { max-width: 680px; margin: 21px 0 17px; color: var(--ink-soft); font-size: 1.12rem; line-height: 1.65; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { padding: 5px 9px; border: 1px solid var(--line); border-radius: 4px; color: #69756d; background: #faf8f2; font: .62rem var(--mono); }
    .progress-section { margin: 43px 0 39px; padding: 21px 23px 17px; border: 1px solid var(--line); border-radius: 9px; background: #edeae1; }
    .progress-heading { display: flex; justify-content: space-between; align-items: flex-end; }
    .progress-heading .eyebrow { margin: 0 0 6px; font-size: .58rem; }
    .progress-heading h2 { margin: 0; font: 400 1.36rem Georgia,serif; }
    .progress-heading > strong { font: 400 2.15rem Georgia,serif; }
    .progress-heading > strong small { margin-left: 2px; color: var(--coral); font: .87rem var(--mono); }
    .progress-track { height: 6px; display: block; overflow: hidden; margin-top: 16px; border-radius: 9px; background: #dad8ce; }
    .progress-track span { height: 100%; display: block; border-radius: inherit; background: var(--fern); transition: width 500ms ease; }
    .progress-foot { display: flex; justify-content: space-between; margin-top: 8px; color: #9a9e96; font: .53rem var(--mono); letter-spacing: .07em; }
    .story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 31px; padding: 0 0 33px; border-bottom: 1px solid var(--line); }
    .story-block .eyebrow { margin: 0 0 8px; font-size: .59rem; }
    .story-block h2 { margin: 0 0 10px; font: 400 1.55rem Georgia,serif; letter-spacing: -.035em; }
    .story-block > p:last-child { margin: 0; color: var(--ink-soft); font-size: .87rem; line-height: 1.7; white-space: pre-line; }
    .project-links { display: flex; flex-direction: column; align-items: flex-start; }
    .project-links a { display: flex; justify-content: space-between; gap: 14px; width: min(100%,300px); padding: 9px 0; border-bottom: 1px solid var(--line); font-size: .82rem; }
    .project-links a span { color: var(--coral); }
    .project-links > p:last-child { margin: 0; color: var(--ink-soft); font-size: .82rem; }
    .timeline-section, .learning-section { padding: 34px 0 30px; border-bottom: 1px solid var(--line); }
    .section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
    .section-heading .eyebrow { margin: 0 0 7px; font-size: .59rem; }
    .section-heading h2 { margin: 0; font: 400 1.85rem Georgia,serif; letter-spacing: -.04em; }
    .section-count { color: #969d96; font: .56rem var(--mono); letter-spacing: .07em; }
    .timeline { border-left: 1px solid #d5d9d1; margin-left: 5px; }
    .timeline-item { position: relative; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 14px; padding: 0 0 20px 22px; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-dot { position: absolute; top: 3px; left: -5px; width: 9px; height: 9px; border: 2px solid var(--paper); border-radius: 50%; background: #c0c7bd; box-shadow: 0 0 0 1px #aeb9ac; }
    .timeline-dot.complete { background: var(--fern); box-shadow: 0 0 0 1px var(--fern); }
    .timeline-copy { display: grid; gap: 4px; }
    .timeline-copy strong { font-size: .85rem; }
    .timeline-copy p { margin: 0; color: var(--ink-soft); font-size: .78rem; line-height: 1.5; white-space: pre-line; }
    .timeline-copy small { color: #9da39c; font-size: .68rem; }
    .timeline-state { color: #89938a; font: .54rem var(--mono); letter-spacing: .08em; }
    .learning-list { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
    .learning-card { padding: 16px 16px 15px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper-strong); }
    .entry-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .entry-kind { padding: 4px 6px; border-radius: 4px; color: #49654d; background: var(--fern-soft); font: .54rem var(--mono); text-transform: uppercase; }
    .entry-kind.challenge { color: #a54e3d; background: var(--coral-soft); }
    .entry-kind.takeaway { color: #806332; background: #f2eadb; }
    .entry-meta time { color: #9ba19a; font-size: .65rem; }
    .learning-card h3 { margin: 12px 0 6px; font-size: .9rem; }
    .learning-card p { margin: 0; color: var(--ink-soft); font-size: .77rem; line-height: 1.6; white-space: pre-line; }
    .empty-line { margin: 0; padding: 15px; border: 1px dashed var(--line); border-radius: 8px; font-size: .83rem; }
    .portfolio-footer { display: flex; justify-content: space-between; gap: 12px; padding-top: 20px; color: #989f97; font-size: .65rem; }
    .portfolio-footer span:first-child { font-family: var(--mono); letter-spacing: .07em; }
    .portfolio-state { max-width: 570px; margin: 13vh auto 0; padding: 36px 30px; text-align: center; }
    .state-mark { width: 44px; height: 44px; display: inline-grid; place-items: center; border-radius: 50%; color: var(--coral); background: var(--coral-soft); font-size: 1.2rem; }
    .portfolio-state .eyebrow { margin: 18px 0 9px; font-size: .6rem; }
    .portfolio-state h1 { margin: 0; font-size: 2.2rem; letter-spacing: -.04em; }
    .portfolio-state > p:not(.eyebrow) { max-width: 420px; margin: 11px auto 18px; color: var(--ink-soft); font-size: .83rem; line-height: 1.6; }
    .portfolio-state .skeleton { height: 110px; margin-top: 17px; border: 0; border-radius: 7px; background: #ebe9e1; }
    .portfolio-state .skeleton.short { width: 66%; height: 47px; margin: 8px auto 0; }
    .shimmer-mark { animation: breathe 1.1s ease-in-out infinite alternate; }
    @keyframes breathe { to { opacity: .45; transform: scale(.94); } }
    @media(max-width:650px) { .portfolio-page { padding: 0 20px 24px; } .public-header { height: 61px; } .public-label { font-size: .52rem; } .portfolio-content { padding-top: 40px; } h1 { font-size: 3.45rem; } .lead { font-size: .98rem; } .story-grid { grid-template-columns: 1fr; gap: 25px; } .learning-list { grid-template-columns: 1fr; } .progress-section { margin: 31px 0 29px; padding: 18px; } .portfolio-state { margin-top: 9vh; padding: 30px 20px; } }
  `,
})
export class PortfolioComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projects = inject(ProjectsService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly data = signal<PublicPortfolioData | null>(null);

  ngOnInit(): void { void this.load(); }

  private async load(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) { this.loading.set(false); return; }
    if (!isSupabaseConfigured()) {
      this.error.set('Supabase is not connected yet. A public project page will work once the project is configured.');
      this.loading.set(false);
      return;
    }
    try {
      this.data.set(await this.projects.publicPortfolio(slug));
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }

  statusLabel(status: ProjectStatus): string { return ({ planning: 'Planning', in_progress: 'In progress', completed: 'Complete', paused: 'Paused' })[status]; }
  kindLabel(kind: string): string { return ({ work: 'Work log', challenge: 'Challenge', takeaway: 'Takeaway' })[kind] ?? 'Learning note'; }
}
