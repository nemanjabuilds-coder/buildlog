import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectsService } from '../../core/data/projects.service';
import { ProjectRow, ProjectStatus } from '../../core/models/database.types';

@Component({
  selector: 'app-project-editor',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="editor-top"><a class="back-link" routerLink="/dashboard">← All projects</a><span class="mono-label">{{ isEditing ? 'PROJECT NOTE / EDIT' : 'PROJECT NOTE / NEW' }}</span></div>
    <section class="editor-heading"><p class="eyebrow">A PLACE TO BEGIN</p><h1>{{ isEditing ? 'Shape the record.' : 'Start with a title.' }}</h1><p>{{ isEditing ? 'Update the working brief. The rest can grow as you learn.' : 'You do not need the whole plan. Just enough to begin.' }}</p></section>

    @if (error()) { <div class="notice notice-error" role="alert">{{ error() }}</div> }
    @if (loading()) { <div class="state-card surface"><p>Opening your project note…</p></div> }
    @else if (notFound()) { <div class="state-card surface"><h2>That project is not here.</h2><p>It may have been removed, or it may belong to another account.</p><a class="btn btn-primary" routerLink="/dashboard">Back to projects</a></div> }
    @else {
      <form class="editor-layout" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-column surface">
          <div class="form-section-heading"><span class="section-number">01</span><div><h2>The brief</h2><p>What are you making, and what are you hoping to learn?</p></div></div>
          <div class="field"><label for="title">Project title <span class="required-mark">*</span></label><input id="title" formControlName="title" placeholder="e.g. A tiny recipe finder" maxlength="120" [attr.aria-invalid]="form.controls.title.invalid && form.controls.title.touched">@if (form.controls.title.touched && form.controls.title.invalid) { <small class="field-error">Give your project a title (up to 120 characters).</small> }</div>
          <div class="field"><label for="description">Description</label><textarea id="description" formControlName="description" placeholder="A sentence or two about what it does…" rows="3"></textarea></div>
          <div class="field"><label for="goals">What you want to learn</label><textarea id="goals" formControlName="goals" placeholder="The questions you want this project to answer…" rows="3"></textarea></div>

          <div class="form-divider"></div>
          <div class="form-section-heading"><span class="section-number">02</span><div><h2>The moving parts</h2><p>Give future-you a few useful signposts.</p></div></div>
          <div class="field"><label for="technologies">Technologies <span class="field-hint">Separate with commas</span></label><input id="technologies" formControlName="technology_tags" placeholder="Angular, TypeScript, Supabase"></div>
          <div class="field-pair">
            <div class="field"><label for="status">Status</label><select id="status" formControlName="status"><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="paused">Paused</option><option value="completed">Completed</option></select></div>
            <div class="field"><label for="target-date">Target date <span class="field-hint">Optional</span></label><input id="target-date" type="date" formControlName="target_date"></div>
          </div>
          <div class="field-pair">
            <div class="field"><label for="repository-url">Repository link <span class="field-hint">Optional</span></label><input id="repository-url" type="url" formControlName="repository_url" placeholder="https://github.com/…"></div>
            <div class="field"><label for="demo-url">Live demo link <span class="field-hint">Optional</span></label><input id="demo-url" type="url" formControlName="demo_url" placeholder="https://…"></div>
          </div>
          <div class="progress-input-row"><div class="field progress-field"><label for="progress">Completion</label><div class="range-row"><input id="progress" type="range" min="0" max="100" step="5" formControlName="progress"><output>{{ form.controls.progress.value }}%</output></div></div></div>

          <div class="form-divider"></div>
          <div class="share-control">
            <div class="share-icon" aria-hidden="true">↗</div>
            <div class="share-copy"><strong>Make a public portfolio page</strong><small>People with the link can view this project and entries you mark public. Private learning notes stay private.</small></div>
            <label class="switch"><input type="checkbox" formControlName="is_public"><span></span><span class="visually-hidden">Make this project public</span></label>
          </div>

          <div class="form-actions"><a class="btn btn-quiet" [routerLink]="isEditing ? ['/projects', projectId] : ['/dashboard']">Cancel</a><button class="btn btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : (isEditing ? 'Save changes' : 'Create project') }} <span aria-hidden="true">↗</span></button></div>
        </div>
        <aside class="editor-side">
          <div class="side-note"><span class="side-note-mark" aria-hidden="true">✳</span><p class="eyebrow">A NOTE TO YOUR FUTURE SELF</p><h3>Make it easy<br>to pick back up.</h3><p>A useful project note is specific enough to get you moving, not perfect enough to slow you down.</p><span class="side-rule"></span><small>THE NEXT STEP IS ENOUGH.</small></div>
          <div class="side-check"><span aria-hidden="true">◌</span><p><strong>Private by default.</strong><br>Nothing appears in your public portfolio until you switch it on.</p></div>
        </aside>
      </form>
    }
  `,
  styles: `
    :host { display: block; }
    .editor-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .back-link { color: var(--ink-soft); font-size: .78rem; }
    .back-link:hover { color: var(--coral); }
    .editor-heading { margin-bottom: 25px; }
    .editor-heading .eyebrow { margin: 0 0 8px; }
    h1 { margin: 0; font-family: Georgia, serif; font-size: clamp(2.3rem,4.4vw,3.45rem); font-weight: 400; letter-spacing: -.055em; }
    .editor-heading > p:last-child { margin: 8px 0 0; color: var(--ink-soft); font-size: .87rem; }
    .editor-layout { display: grid; grid-template-columns: minmax(0,1fr) 235px; gap: 22px; align-items: start; }
    .form-column { padding: 25px 27px 22px; }
    .form-section-heading { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 19px; }
    .section-number { width: 27px; height: 27px; display: grid; place-items: center; flex: 0 0 auto; border: 1px solid #e8c9be; border-radius: 50%; color: var(--coral); font: .65rem var(--mono); }
    .form-section-heading h2 { margin: 0; font-family: Georgia, serif; font-size: 1.25rem; font-weight: 400; }
    .form-section-heading p { margin: 4px 0 0; color: var(--ink-soft); font-size: .73rem; }
    .form-column > .field, .field-pair, .progress-input-row { margin-left: 39px; }
    .form-column > .field { margin-bottom: 15px; }
    .field-hint { margin-left: 5px; color: #9da39c; font-size: .66rem; font-weight: 400; }
    .required-mark { color: var(--coral); }
    .field-pair { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; margin-bottom: 15px; }
    .range-row { display: flex; align-items: center; gap: 13px; }
    .range-row input { flex: 1; accent-color: var(--coral); }
    .range-row output { min-width: 39px; color: var(--coral); font: .75rem var(--mono); }
    .form-divider { height: 1px; margin: 23px 0; background: var(--line); }
    .share-control { display: flex; align-items: center; gap: 13px; margin-left: 39px; padding: 13px; border: 1px solid var(--line); border-radius: 8px; background: #faf8f2; }
    .share-icon { width: 34px; height: 34px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 7px; color: var(--coral); background: var(--coral-soft); }
    .share-copy { display: grid; gap: 4px; min-width: 0; flex: 1; }
    .share-copy strong { font-size: .76rem; }
    .share-copy small { color: var(--ink-soft); font-size: .67rem; line-height: 1.45; }
    .switch { position: relative; width: 38px; height: 22px; flex: 0 0 auto; cursor: pointer; }
    .switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    .switch > span:first-of-type { position: absolute; inset: 0; border-radius: 99px; background: #c8cbc5; transition: background 150ms ease; }
    .switch > span:first-of-type::after { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: white; content: ''; transition: transform 150ms ease; }
    .switch input:checked + span:first-of-type { background: var(--fern); }
    .switch input:checked + span:first-of-type::after { transform: translateX(16px); }
    .switch input:focus-visible + span:first-of-type { outline: 3px solid rgb(216 93 69 / 35%); outline-offset: 2px; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 9px; margin: 24px 0 0 39px; }
    .editor-side { display: grid; gap: 13px; }
    .side-note { padding: 18px 17px 16px; border-radius: 8px; color: #f3f3e9; background: var(--ink); }
    .side-note-mark { color: #e68a72; font-size: 1.16rem; }
    .side-note .eyebrow { margin: 8px 0 13px; color: #e68a72; font-size: .56rem; }
    .side-note h3 { margin: 0; font-family: Georgia, serif; font-size: 1.65rem; font-weight: 400; letter-spacing: -.045em; line-height: 1.02; }
    .side-note > p:not(.eyebrow) { margin: 12px 0 16px; color: #bdc8bf; font-size: .74rem; line-height: 1.6; }
    .side-rule { display: block; width: 29px; height: 1px; margin-bottom: 9px; background: #e68a72; }
    .side-note small { color: #aebbb2; font: .52rem var(--mono); letter-spacing: .08em; }
    .side-check { display: flex; gap: 8px; padding: 13px 12px; border: 1px solid var(--line); border-radius: 8px; color: var(--ink-soft); background: #efede6; }
    .side-check > span { color: var(--fern); font-size: .95rem; }
    .side-check p { margin: 0; font-size: .69rem; line-height: 1.5; }
    .side-check strong { color: var(--ink); }
    @media(max-width: 850px) { .editor-layout { grid-template-columns: 1fr; } .editor-side { grid-template-columns: repeat(2,minmax(0,1fr)); } .side-note h3 br { display: none; } }
    @media(max-width: 600px) { .form-column { padding: 21px 16px; } .form-column > .field, .field-pair, .progress-input-row, .share-control, .form-actions { margin-left: 0; } .field-pair { grid-template-columns: 1fr; gap: 13px; } .editor-side { grid-template-columns: 1fr; } .editor-top .mono-label { font-size: .53rem; } }
  `,
})
export class ProjectEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectsService = inject(ProjectsService);
  readonly projectId = this.route.snapshot.paramMap.get('id');
  readonly isEditing = Boolean(this.projectId);
  readonly loading = signal(this.isEditing);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notFound = signal(false);
  private existingProject: ProjectRow | null = null;
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    goals: [''],
    technology_tags: [''],
    status: this.fb.nonNullable.control<ProjectStatus>('planning'),
    progress: [0, [Validators.min(0), Validators.max(100)]],
    repository_url: ['', [Validators.pattern(/^$|^https?:\/\/.+/i)]],
    demo_url: ['', [Validators.pattern(/^$|^https?:\/\/.+/i)]],
    target_date: [''],
    is_public: [false],
  });

  ngOnInit(): void { if (this.projectId) void this.loadProject(this.projectId); }

  private async loadProject(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const project = await this.projectsService.getProject(id);
      if (!project) { this.notFound.set(true); return; }
      this.existingProject = project;
      this.form.patchValue({
        title: project.title,
        description: project.description,
        goals: project.goals,
        technology_tags: project.technology_tags.join(', '),
        status: project.status,
        progress: project.progress,
        repository_url: project.repository_url ?? '',
        demo_url: project.demo_url ?? '',
        target_date: project.target_date ?? '',
        is_public: project.is_public,
      });
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Could not open this project.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.error.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    const tags = [...new Set(value.technology_tags.split(',').map((tag) => tag.trim()).filter(Boolean))];
    const slug = this.existingProject?.public_slug ?? `${slugify(value.title)}-${crypto.randomUUID().slice(0, 6)}`;
    const input = {
      title: value.title.trim(),
      description: value.description.trim(),
      goals: value.goals.trim(),
      technology_tags: tags,
      status: value.status,
      progress: Number(value.progress),
      repository_url: value.repository_url.trim() || null,
      demo_url: value.demo_url.trim() || null,
      target_date: value.target_date || null,
      is_public: value.is_public,
      public_slug: slug,
    };
    try {
      const saved = this.projectId
        ? await this.projectsService.updateProject(this.projectId, input)
        : await this.projectsService.createProject(input);
      await this.router.navigate(['/projects', saved.id]);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Could not save this project. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}

function slugify(value: string): string {
  const base = value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'project';
  return base;
}
