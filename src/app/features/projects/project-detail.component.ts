import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LearningEntryKind, LearningEntryRow, MilestoneRow, ProjectRow } from '../../core/models/database.types';
import { ProjectsService } from '../../core/data/projects.service';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="state-card surface"><span class="loading-mark" aria-hidden="true">✳</span><p>Gathering the latest notes…</p></div>
    } @else if (error() && !project()) {
      <div class="detail-top"><a class="back-link" routerLink="/dashboard">← All projects</a></div><div class="state-card surface"><h2>Project unavailable</h2><p>{{ error() }}</p><a class="btn btn-quiet" routerLink="/dashboard">Back to your projects</a></div>
    } @else if (project(); as current) {
      <div class="detail-top"><a class="back-link" routerLink="/dashboard">← All projects</a><span class="mono-label">FIELD NOTE / {{ current.created_at | date:'MMM y' }}</span></div>
      @if (notice()) { <div class="notice notice-success" role="status">{{ notice() }}</div> }
      @if (error()) { <div class="notice notice-error" role="alert">{{ error() }}</div> }

      <header class="detail-heading">
        <div class="title-copy"><p class="eyebrow">{{ current.is_public ? 'PUBLIC PROJECT NOTE' : 'PRIVATE PROJECT NOTE' }} / {{ statusLabel(current.status) }}</p><h1>{{ current.title }}<span class="title-period">.</span></h1><p class="detail-description">{{ current.description || 'A work in progress — and a record of the things you are learning along the way.' }}</p>
          <div class="tag-row">@for (tag of current.technology_tags; track tag) { <span class="tech-tag">{{ tag }}</span> }</div>
        </div>
        <div class="detail-actions"><a class="btn btn-quiet" [routerLink]="['/projects', current.id, 'edit']">Edit note</a><button type="button" class="btn" [class.btn-primary]="current.is_public" [class.btn-quiet]="!current.is_public" (click)="togglePublic()">{{ current.is_public ? 'Public link ↗' : 'Share note' }}</button><button type="button" class="icon-button delete-button" aria-label="Delete project" title="Delete project" (click)="deleteProject()">⌫</button></div>
      </header>

      <section class="progress-card surface">
        <div class="progress-numeral"><span class="mono-label">THE WORK SO FAR</span><strong>{{ current.progress }}<small>%</small></strong></div>
        <div class="progress-main"><div class="progress-header"><div><p class="eyebrow">PROGRESS, NOT PERFECTION</p><h2>{{ progressMessage(current.progress) }}</h2></div><span class="status-pill" [class]="'status-pill ' + current.status">{{ statusLabel(current.status) }}</span></div><div class="progress-track"><span [style.width.%]="current.progress"></span></div><div class="progress-labels"><span>START</span><span>KEEP MOVING</span></div></div>
      </section>

      <div class="detail-columns">
        <div class="main-detail">
          <section class="overview-grid">
            <article class="overview-note"><p class="eyebrow">THE INTENTION</p><h2>What I want to learn</h2><p>{{ current.goals || 'Add a learning goal when you edit this project note.' }}</p></article>
            <article class="overview-note link-note"><p class="eyebrow">THE WORK ITSELF</p><h2>Useful links</h2>
              @if (current.repository_url) { <a [href]="current.repository_url" target="_blank" rel="noopener noreferrer">Repository <span aria-hidden="true">↗</span></a> }
              @if (current.demo_url) { <a [href]="current.demo_url" target="_blank" rel="noopener noreferrer">Live demo <span aria-hidden="true">↗</span></a> }
              @if (!current.repository_url && !current.demo_url) { <p>Add repository or demo links when you edit this note.</p> }
            </article>
          </section>

          <section class="work-section" aria-labelledby="milestones-heading">
            <div class="section-head"><div><p class="eyebrow">THE NEXT SMALL STEP</p><h2 id="milestones-heading">Milestones <span class="count">{{ milestones().length }}</span></h2></div><button class="text-button" type="button" (click)="toggleMilestoneForm()">{{ showMilestoneForm() ? 'Close' : '＋ Add milestone' }}</button></div>
            @if (showMilestoneForm()) {
              <form class="inline-form surface" [formGroup]="milestoneForm" (ngSubmit)="addMilestone()">
                <div class="field"><label for="milestone-title">Milestone</label><input id="milestone-title" formControlName="title" placeholder="What is the next useful checkpoint?" maxlength="160"></div>
                <div class="field"><label for="milestone-notes">Notes <span class="field-hint">Optional</span></label><input id="milestone-notes" formControlName="notes" placeholder="A detail to remember…"></div>
                <div class="inline-fields"><div class="field"><label for="milestone-date">Target date</label><input id="milestone-date" type="date" formControlName="due_date"></div><label class="check-label"><input type="checkbox" formControlName="is_public"> Show on public page</label><button class="btn btn-primary" type="submit" [disabled]="milestoneSaving()">{{ milestoneSaving() ? 'Adding…' : 'Add milestone' }}</button></div>
              </form>
            }
            @if (milestones().length === 0) { <div class="quiet-empty">No milestones yet. Add one for the next small checkpoint.</div> }
            <div class="milestone-list">@for (milestone of milestones(); track milestone.id) {
              <article class="milestone-row" [class.is-done]="milestone.is_complete"><button type="button" class="milestone-check" [attr.aria-label]="milestone.is_complete ? 'Mark ' + milestone.title + ' incomplete' : 'Mark ' + milestone.title + ' complete'" (click)="toggleMilestone(milestone)">{{ milestone.is_complete ? '✓' : '' }}</button><div class="milestone-copy"><strong>{{ milestone.title }}</strong>@if (milestone.notes) { <p>{{ milestone.notes }}</p> }<small>@if (milestone.due_date) { {{ milestone.due_date | date:'MMM d, y' }} · }{{ milestone.is_public ? 'Public note' : 'Private note' }}</small></div><button type="button" class="remove-button" [attr.aria-label]="'Delete ' + milestone.title" (click)="removeMilestone(milestone)">×</button>
              </article>
            }</div>
          </section>

          <section class="work-section learning-work" aria-labelledby="learning-heading">
            <div class="section-head"><div><p class="eyebrow">WHAT THE WORK TAUGHT YOU</p><h2 id="learning-heading">Learning log <span class="count">{{ entries().length }}</span></h2></div><button class="text-button" type="button" (click)="toggleEntryForm()">{{ showEntryForm() ? 'Close' : '＋ Add a note' }}</button></div>
            @if (showEntryForm()) {
              <form class="entry-form surface" [formGroup]="entryForm" (ngSubmit)="addEntry()">
                <div class="entry-form-top"><div class="field"><label for="entry-kind">This note is a</label><select id="entry-kind" formControlName="kind"><option value="work">Work log</option><option value="challenge">Challenge</option><option value="takeaway">Takeaway</option></select></div><div class="field"><label for="entry-visibility">Visibility</label><select id="entry-visibility" formControlName="visibility"><option value="private">Private</option><option value="public">Public portfolio</option></select></div></div>
                <div class="field"><label for="entry-title">Title</label><input id="entry-title" formControlName="title" placeholder="What did you work through?" maxlength="160"></div>
                <div class="field"><label for="entry-body">The note</label><textarea id="entry-body" formControlName="body" placeholder="What happened, what was tricky, or what clicked?" rows="4" maxlength="5000"></textarea></div>
                <div class="entry-form-actions"><span class="field-hint">Private notes never appear on your public page.</span><button class="btn btn-primary" type="submit" [disabled]="entrySaving()">{{ entrySaving() ? 'Saving…' : 'Save learning note' }}</button></div>
              </form>
            }
            @if (entries().length === 0) { <div class="quiet-empty">No learning notes yet. Record the useful parts, not just the finished result.</div> }
            <div class="entry-list">@for (entry of entries(); track entry.id) {
              <article class="entry-card surface"><div class="entry-meta"><span [class]="'entry-kind ' + entry.kind">{{ kindLabel(entry.kind) }}</span><time>{{ entry.created_at | date:'MMM d, y' }}</time><span class="entry-visibility">{{ entry.visibility === 'public' ? 'Public' : 'Private' }}</span></div><div class="entry-title-row"><h3>{{ entry.title }}</h3><button type="button" class="remove-button" [attr.aria-label]="'Delete learning note ' + entry.title" (click)="removeEntry(entry)">×</button></div><p>{{ entry.body }}</p></article>
            }</div>
          </section>
        </div>

        <aside class="detail-aside">
          <section class="share-card surface"><div class="share-card-top"><span class="share-symbol" aria-hidden="true">↗</span><span class="mono-label">YOUR PUBLIC PAGE</span></div><h2>{{ current.is_public ? 'Ready to share.' : 'Share only when ready.' }}</h2><p>{{ current.is_public ? 'Anyone with this link can view the project, public milestones, and public learning notes.' : 'Your project stays private. Turn on public sharing when the record is ready.' }}</p>
            @if (current.is_public && current.public_slug) { <div class="share-url">{{ portfolioUrl(current.public_slug) }}</div><button class="btn btn-accent share-button" type="button" (click)="copyPortfolioLink(current.public_slug)">{{ copied() ? 'Copied to clipboard ✓' : 'Copy share link' }}</button><a class="preview-link" [routerLink]="['/portfolio', current.public_slug]" target="_blank">Preview public page ↗</a> }
            @else { <button class="btn btn-quiet share-button" type="button" (click)="togglePublic()">Turn on public sharing</button> }
          </section>
          <section class="details-card"><p class="eyebrow">IN THE MARGINS</p><div class="detail-fact"><span>Started</span><strong>{{ current.created_at | date:'MMM d, y' }}</strong></div><div class="detail-fact"><span>Last touched</span><strong>{{ current.updated_at | date:'MMM d, y' }}</strong></div><div class="detail-fact"><span>Target date</span><strong>{{ current.target_date ? (current.target_date | date:'MMM d, y') : 'Not set' }}</strong></div><div class="detail-fact"><span>Technology</span><strong>{{ current.technology_tags.length || '—' }} tags</strong></div></section>
          <div class="privacy-aside"><span aria-hidden="true">◌</span><p><strong>Private by default.</strong><br>Only public project notes and entries selected as public are visible from your share link.</p></div>
        </aside>
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .detail-top { display: flex; justify-content: space-between; margin-bottom: 27px; }
    .back-link { color: var(--ink-soft); font-size: .78rem; }
    .back-link:hover { color: var(--coral); }
    .detail-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 26px; margin-bottom: 24px; }
    .title-copy { min-width: 0; }
    .title-copy .eyebrow { margin: 0 0 9px; font-size: .61rem; }
    h1 { margin: 0; font: 400 clamp(2.8rem,5vw,4.1rem)/.98 Georgia,serif; letter-spacing: -.058em; }
    .title-period { color: var(--coral); }
    .detail-description { max-width: 640px; margin: 12px 0 11px; color: var(--ink-soft); font-size: .88rem; line-height: 1.6; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 5px; }
    .tech-tag { padding: 4px 7px; border: 1px solid var(--line); border-radius: 4px; color: #69756d; background: #faf8f2; font: .57rem var(--mono); }
    .detail-actions { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; }
    .delete-button { color: #ae5a4b; font-size: 1.05rem; }
    .progress-card { display: grid; grid-template-columns: 127px minmax(0,1fr); gap: 21px; margin-bottom: 26px; padding: 19px 21px; background: #edeae1; }
    .progress-numeral { display: grid; align-content: center; gap: 6px; border-right: 1px solid #d7d4cb; }
    .progress-numeral .mono-label { font-size: .56rem; }
    .progress-numeral strong { font: 400 2.45rem Georgia,serif; letter-spacing: -.04em; }
    .progress-numeral small { margin-left: 2px; color: var(--coral); font: .85rem var(--mono); }
    .progress-main { min-width: 0; }
    .progress-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
    .progress-header .eyebrow { margin: 0 0 4px; font-size: .56rem; }
    .progress-header h2 { margin: 0; font: 400 1.2rem Georgia,serif; }
    .status-pill { padding: 4px 7px; border-radius: 20px; font: .56rem var(--mono); }
    .status-pill.planning { color: #7d6845; background: #f3ead9; }.status-pill.in_progress { color: #44684b; background: var(--fern-soft); }.status-pill.completed { color: #536d78; background: #e3edf0; }.status-pill.paused { color: #826c75; background: #eee6eb; }
    .progress-track { height: 5px; display: block; overflow: hidden; margin-top: 13px; border-radius: 9px; background: #d9d8cf; }
    .progress-track span { height: 100%; display: block; border-radius: inherit; background: var(--fern); transition: width 450ms ease; }
    .progress-labels { display: flex; justify-content: space-between; margin-top: 7px; color: #9a9f97; font: .51rem var(--mono); letter-spacing: .07em; }
    .detail-columns { display: grid; grid-template-columns: minmax(0,1fr) 265px; gap: 22px; align-items: start; }
    .main-detail { min-width: 0; }
    .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; margin-bottom: 29px; }
    .overview-note { min-height: 148px; padding: 16px 17px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper-strong); }
    .overview-note .eyebrow { margin: 0 0 7px; font-size: .56rem; }
    .overview-note h2 { margin: 0 0 8px; font: 400 1.23rem Georgia,serif; }
    .overview-note > p:last-child { margin: 0; color: var(--ink-soft); font-size: .77rem; line-height: 1.55; white-space: pre-line; }
    .link-note a { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: .76rem; }
    .link-note a span { color: var(--coral); }
    .work-section { margin: 0 0 30px; }
    .section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-bottom: 13px; }
    .section-head .eyebrow { margin: 0 0 6px; font-size: .57rem; }
    .section-head h2 { display: flex; align-items: center; gap: 8px; margin: 0; font: 400 1.55rem Georgia,serif; letter-spacing: -.03em; }
    .count { min-width: 22px; height: 22px; display: inline-grid; place-items: center; border-radius: 50%; color: var(--ink-soft); background: #e9e6de; font: .63rem var(--mono); }
    .text-button { padding: 6px 0; border: 0; color: var(--coral); background: transparent; font-size: .73rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .text-button:hover { color: #ad4936; }
    .inline-form, .entry-form { display: grid; gap: 12px; margin-bottom: 13px; padding: 15px; }
    .field-hint { margin-left: 4px; color: #9da39c; font-size: .65rem; font-weight: 400; }
    .inline-fields { display: flex; align-items: flex-end; gap: 13px; }
    .inline-fields .field { flex: 0 1 190px; }
    .check-label { display: flex; align-items: center; gap: 6px; margin: 0 auto 10px 0; color: var(--ink-soft); font-size: .69rem; }
    .check-label input { accent-color: var(--fern); }
    .milestone-list { border-top: 1px solid var(--line); }
    .milestone-row { display: grid; grid-template-columns: 26px minmax(0,1fr) 22px; gap: 9px; align-items: start; padding: 12px 0; border-bottom: 1px solid var(--line); }
    .milestone-check { width: 19px; height: 19px; display: grid; place-items: center; padding: 0; border: 1px solid #bdc7bb; border-radius: 50%; color: white; background: transparent; font-size: .68rem; cursor: pointer; }
    .milestone-row.is-done .milestone-check { border-color: var(--fern); background: var(--fern); }
    .milestone-copy { display: grid; gap: 4px; }
    .milestone-copy strong { font-size: .82rem; font-weight: 600; }
    .milestone-copy p { margin: 0; color: var(--ink-soft); font-size: .73rem; line-height: 1.45; }
    .milestone-copy small { color: #929991; font-size: .64rem; }
    .milestone-row.is-done .milestone-copy strong { color: #78837b; text-decoration: line-through; text-decoration-color: #aeb7ae; }
    .remove-button { border: 0; color: #a4aaa4; background: transparent; font-size: 1.15rem; cursor: pointer; }
    .remove-button:hover { color: var(--coral); }
    .quiet-empty { padding: 16px 13px; border: 1px dashed var(--line); border-radius: 7px; color: var(--ink-soft); font-size: .77rem; }
    .learning-work { margin-top: 34px; }
    .entry-form { gap: 11px; }
    .entry-form-top { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
    .entry-form-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .entry-list { display: grid; gap: 10px; }
    .entry-card { padding: 14px 15px; }
    .entry-meta { display: flex; align-items: center; gap: 8px; }
    .entry-kind { padding: 4px 6px; border-radius: 4px; color: #49654d; background: var(--fern-soft); font: .53rem var(--mono); text-transform: uppercase; }
    .entry-kind.challenge { color: #a54e3d; background: var(--coral-soft); }.entry-kind.takeaway { color: #806332; background: #f2eadb; }
    .entry-meta time { color: #9ba19a; font-size: .64rem; }
    .entry-visibility { margin-left: auto; color: #8c968d; font: .54rem var(--mono); text-transform: uppercase; }
    .entry-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .entry-title-row h3 { margin: 9px 0 4px; font-size: .86rem; }
    .entry-card > p { margin: 0; color: var(--ink-soft); font-size: .77rem; line-height: 1.6; white-space: pre-line; }
    .detail-aside { display: grid; gap: 13px; }
    .share-card { padding: 17px 16px; }
    .share-card-top { display: flex; align-items: center; gap: 8px; }
    .share-symbol { width: 29px; height: 29px; display: grid; place-items: center; border-radius: 6px; color: var(--coral); background: var(--coral-soft); }
    .share-card-top .mono-label { font-size: .55rem; }
    .share-card h2 { margin: 14px 0 7px; font: 400 1.42rem Georgia,serif; letter-spacing: -.035em; }
    .share-card > p { margin: 0 0 14px; color: var(--ink-soft); font-size: .72rem; line-height: 1.55; }
    .share-url { overflow: hidden; padding: 8px 9px; border: 1px solid var(--line); border-radius: 5px; color: #718075; background: #f9f7f1; font: .58rem var(--mono); text-overflow: ellipsis; white-space: nowrap; }
    .share-button { width: 100%; margin-top: 9px; }
    .preview-link { display: block; margin-top: 9px; color: var(--ink-soft); text-align: center; font-size: .69rem; }
    .preview-link:hover { color: var(--coral); }
    .details-card { padding: 15px 16px; border: 1px solid var(--line); border-radius: 8px; }
    .details-card .eyebrow { margin: 0 0 10px; font-size: .56rem; }
    .detail-fact { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-top: 1px solid #e9e6de; color: var(--ink-soft); font-size: .68rem; }
    .detail-fact strong { color: var(--ink); font-size: .68rem; font-weight: 600; text-align: right; }
    .privacy-aside { display: flex; gap: 8px; padding: 12px; border-radius: 7px; background: #efede6; }
    .privacy-aside > span { color: var(--fern); }
    .privacy-aside p { margin: 0; color: var(--ink-soft); font-size: .66rem; line-height: 1.5; }
    .privacy-aside strong { color: var(--ink); }
    .loading-mark { color: var(--coral); }
    @media(max-width: 1050px) { .detail-columns { grid-template-columns: minmax(0,1fr) 235px; gap: 16px; } .detail-actions { gap: 5px; } .detail-actions .btn { padding: 0 10px; font-size: .76rem; } }
    @media(max-width: 850px) { .detail-heading { align-items: flex-start; flex-direction: column; } .detail-columns { grid-template-columns: 1fr; } .detail-aside { grid-template-columns: repeat(2,minmax(0,1fr)); } .privacy-aside { grid-column: 1/-1; } }
    @media(max-width: 600px) { .detail-top .mono-label { font-size: .51rem; } .detail-heading { gap: 17px; } .detail-actions { flex-wrap: wrap; } .progress-card { grid-template-columns: 82px minmax(0,1fr); gap: 13px; padding: 15px; } .progress-numeral strong { font-size: 2rem; } .progress-header h2 { font-size: 1.05rem; } .overview-grid { grid-template-columns: 1fr; } .overview-note { min-height: 0; } .inline-fields { align-items: stretch; flex-direction: column; } .inline-fields .field { flex-basis: auto; } .check-label { margin: 0; } .entry-form-top { grid-template-columns: 1fr; } .entry-form-actions { align-items: flex-start; flex-direction: column; } .entry-form-actions .btn { align-self: flex-end; } .detail-aside { grid-template-columns: 1fr; } .privacy-aside { grid-column: auto; } }
  `,
})
export class ProjectDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectsService = inject(ProjectsService);
  readonly project = signal<ProjectRow | null>(null);
  readonly milestones = signal<MilestoneRow[]>([]);
  readonly entries = signal<LearningEntryRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly copied = signal(false);
  readonly showMilestoneForm = signal(false);
  readonly showEntryForm = signal(false);
  readonly milestoneSaving = signal(false);
  readonly entrySaving = signal(false);
  private readonly projectId = this.route.snapshot.paramMap.get('id');
  readonly milestoneForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    notes: [''],
    due_date: [''],
    is_public: [false],
  });
  readonly entryForm = this.fb.nonNullable.group({
    kind: this.fb.nonNullable.control<LearningEntryKind>('work'),
    title: ['', [Validators.required, Validators.maxLength(160)]],
    body: ['', [Validators.required, Validators.maxLength(5000)]],
    visibility: this.fb.nonNullable.control<'private' | 'public'>('private'),
  });
  readonly progressText = computed(() => this.project() ? this.progressMessage(this.project()!.progress) : '');

  ngOnInit(): void { void this.load(); }

  toggleMilestoneForm(): void { this.showMilestoneForm.update((value) => !value); }
  toggleEntryForm(): void { this.showEntryForm.update((value) => !value); }

  private async load(): Promise<void> {
    if (!this.projectId) { this.loading.set(false); this.error.set('This project link is incomplete.'); return; }
    this.loading.set(true);
    this.error.set('');
    try {
      const project = await this.projectsService.getProject(this.projectId);
      this.project.set(project);
      if (!project) { this.error.set('This project may have been removed or belongs to another account.'); return; }
      const [milestones, entries] = await Promise.all([
        this.projectsService.listMilestones(project.id),
        this.projectsService.listEntries(project.id),
      ]);
      this.milestones.set(milestones);
      this.entries.set(entries);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Could not load this project.');
    } finally {
      this.loading.set(false);
    }
  }

  async addMilestone(): Promise<void> {
    this.milestoneForm.markAllAsTouched();
    if (this.milestoneForm.invalid || !this.project()) return;
    this.milestoneSaving.set(true);
    this.error.set('');
    const value = this.milestoneForm.getRawValue();
    try {
      await this.projectsService.createMilestone(this.project()!.id, {
        title: value.title.trim(), notes: value.notes.trim(), due_date: value.due_date || null,
        is_complete: false, is_public: value.is_public, sort_order: this.milestones().length,
      });
      this.milestoneForm.reset({ title: '', notes: '', due_date: '', is_public: false });
      this.showMilestoneForm.set(false);
      await this.load();
      this.notice.set('Milestone added to the trail.');
    } catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'Could not add this milestone.'); }
    finally { this.milestoneSaving.set(false); }
  }

  async toggleMilestone(milestone: MilestoneRow): Promise<void> {
    this.error.set('');
    try {
      await this.projectsService.updateMilestone(milestone.id, { is_complete: !milestone.is_complete });
      await this.load();
    } catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'Could not update this milestone.'); }
  }

  async removeMilestone(milestone: MilestoneRow): Promise<void> {
    if (!window.confirm(`Delete the milestone “${milestone.title}”?`)) return;
    try { await this.projectsService.deleteMilestone(milestone.id); await this.load(); }
    catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'Could not delete this milestone.'); }
  }

  async addEntry(): Promise<void> {
    this.entryForm.markAllAsTouched();
    if (this.entryForm.invalid || !this.project()) return;
    this.entrySaving.set(true);
    this.error.set('');
    const value = this.entryForm.getRawValue();
    try {
      await this.projectsService.createEntry(this.project()!.id, {
        kind: value.kind, title: value.title.trim(), body: value.body.trim(), visibility: value.visibility,
      });
      this.entryForm.reset({ kind: 'work', title: '', body: '', visibility: 'private' });
      this.showEntryForm.set(false);
      await this.load();
      this.notice.set('Learning note saved. Keep the useful details.');
    } catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'Could not save this learning note.'); }
    finally { this.entrySaving.set(false); }
  }

  async removeEntry(entry: LearningEntryRow): Promise<void> {
    if (!window.confirm(`Delete the learning note “${entry.title}”?`)) return;
    try { await this.projectsService.deleteEntry(entry.id); await this.load(); }
    catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'Could not delete this learning note.'); }
  }

  async togglePublic(): Promise<void> {
    const current = this.project();
    if (!current) return;
    this.error.set('');
    try {
      const updated = await this.projectsService.setProjectVisibility(current, !current.is_public);
      this.project.set(updated);
      this.notice.set(updated.is_public ? 'Public sharing is on. Only explicitly public entries appear on the page.' : 'This project is private again.');
    } catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'Could not update public sharing.'); }
  }

  async copyPortfolioLink(slug: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.portfolioUrl(slug));
      this.copied.set(true);
      window.setTimeout(() => this.copied.set(false), 2200);
    } catch { this.error.set('Clipboard access was blocked. You can copy the link shown above.'); }
  }

  portfolioUrl(slug: string): string { return `${window.location.origin}/portfolio/${slug}`; }

  async deleteProject(): Promise<void> {
    const current = this.project();
    if (!current || !window.confirm(`Delete “${current.title}” and its milestones and learning entries? This cannot be undone.`)) return;
    try { await this.projectsService.deleteProject(current.id); await this.router.navigateByUrl('/dashboard'); }
    catch (error: unknown) { this.error.set(error instanceof Error ? error.message : 'Could not delete this project.'); }
  }

  statusLabel(status: ProjectRow['status']): string { return ({ planning: 'Planning', in_progress: 'In progress', completed: 'Completed', paused: 'Paused' })[status]; }
  kindLabel(kind: string): string { return ({ work: 'Work log', challenge: 'Challenge', takeaway: 'Takeaway' })[kind] ?? 'Learning note'; }
  progressMessage(progress: number): string { return progress >= 100 ? 'You brought it all the way home.' : progress >= 60 ? 'The shape of it is coming through.' : progress >= 25 ? 'The pieces are starting to connect.' : 'A good place to begin.'; }
}
