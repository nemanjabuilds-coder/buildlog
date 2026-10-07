import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardActivity, ProjectsService } from '../../core/data/projects.service';
import { ProjectRow, ProjectStatus } from '../../core/models/database.types';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  template: `
    <section class="intro-row">
      <div>
        <p class="eyebrow">YOUR PROJECTS / FIELD NOTES</p>
        <h1>Good work<br><em>leaves a trail.</em></h1>
        <p class="intro-copy">Keep the experiments, the small wins, and the things you figured out along the way.</p>
      </div>
      <a class="btn btn-accent new-project" routerLink="/projects/new"><span aria-hidden="true">＋</span> Add a project</a>
    </section>

    @if (error()) {
      <div class="notice notice-error error-banner" role="alert"><span aria-hidden="true">!</span><span>{{ error() }}</span></div>
    }

    <section class="stats-strip" aria-label="Project summary">
      <div class="stat"><span class="mono-label">IN YOUR NOTEBOOK</span><strong>{{ projects().length | number:'2.0' }}</strong><small>projects</small></div>
      <div class="stat"><span class="mono-label">IN MOTION</span><strong>{{ activeCount() | number:'2.0' }}</strong><small>active now</small></div>
      <div class="stat"><span class="mono-label">CLOSED THE LOOP</span><strong>{{ completedCount() | number:'2.0' }}</strong><small>completed</small></div>
      <div class="stat"><span class="mono-label">RECENT NOTES</span><strong>{{ activities().length | number:'2.0' }}</strong><small>learning entries</small></div>
      <span class="stats-stamp" aria-hidden="true">✳</span>
    </section>

    <div class="content-columns">
      <section class="project-section" aria-labelledby="project-heading">
        <div class="section-head">
          <div><p class="eyebrow">THE WORK IN PROGRESS</p><h2 id="project-heading">Your projects<span class="count">{{ filteredProjects().length }}</span></h2></div>
          <span class="sort-note">UPDATED AS YOU GO <span aria-hidden="true">↘</span></span>
        </div>

        <div class="filters surface">
          <label class="search-field">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>
            <input aria-label="Search projects" type="search" placeholder="Find a project or technology…" [ngModel]="query()" (ngModelChange)="query.set($event)">
          </label>
          <label class="filter-select"><span class="visually-hidden">Filter by status</span>
            <select aria-label="Filter by status" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
              <option value="all">All statuses</option><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="paused">Paused</option><option value="completed">Completed</option>
            </select>
          </label>
          <label class="filter-select"><span class="visually-hidden">Filter by technology</span>
            <select aria-label="Filter by technology" [ngModel]="technologyFilter()" (ngModelChange)="technologyFilter.set($event)">
              <option value="all">All tech</option>@for (technology of technologies(); track technology) { <option [value]="technology">{{ technology }}</option> }
            </select>
          </label>
          <button type="button" class="reset-filter" [disabled]="!hasFilters()" (click)="resetFilters()">Clear</button>
        </div>

        @if (loading()) {
          <div class="loading-list" aria-label="Loading projects"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>
        } @else if (projects().length === 0) {
          <div class="empty-state surface"><span class="empty-icon" aria-hidden="true">＋</span><h3>Your notebook starts here.</h3><p>Add the project you're learning on right now. Keep the brief version; the detail comes as you go.</p><a class="btn btn-primary" routerLink="/projects/new">Create your first project</a></div>
        } @else if (filteredProjects().length === 0) {
          <div class="empty-state surface"><span class="empty-icon" aria-hidden="true">⌕</span><h3>No projects found.</h3><p>Try another keyword or clear one of the filters.</p><button class="btn btn-quiet" type="button" (click)="resetFilters()">Clear filters</button></div>
        } @else {
          <div class="project-list">
            @for (project of filteredProjects(); track project.id; let index = $index) {
              <a class="project-card surface" [routerLink]="['/projects', project.id]">
                <div class="card-index">{{ (index + 1).toString().padStart(2, '0') }}</div>
                <div class="card-main">
                  <div class="title-row"><h3>{{ project.title }}</h3><span class="status-pill" [class]="'status-pill ' + project.status">{{ statusLabel(project.status) }}</span></div>
                  <p class="project-description">{{ project.description || 'A work in progress — add a few notes about what you are exploring.' }}</p>
                  <div class="tag-row">@for (tag of project.technology_tags; track tag) { <span class="tech-tag">{{ tag }}</span> } @if (project.is_public) { <span class="public-tag"><span></span> Shared</span> }</div>
                  <div class="progress-line"><span class="progress-track"><span [style.width.%]="project.progress"></span></span><span class="progress-number">{{ project.progress }}%</span><span class="updated">Updated {{ project.updated_at | date:'MMM d' }}</span></div>
                </div>
                <span class="card-arrow" aria-hidden="true">↗</span>
              </a>
            }
          </div>
        }
      </section>

      <aside class="activity-section" id="activity" aria-labelledby="activity-heading">
        <div class="section-head activity-head"><div><p class="eyebrow">WHAT YOU LEARNED</p><h2 id="activity-heading">Recent notes</h2></div><span class="activity-mark" aria-hidden="true">↗</span></div>
        @if (loading()) {
          <div class="activity-loading"><div class="skeleton"></div><div class="skeleton"></div></div>
        } @else if (activities().length === 0) {
          <div class="activity-empty"><span class="empty-icon" aria-hidden="true">✎</span><p>No notes yet. Every challenge you work through is worth remembering.</p></div>
        } @else {
          <div class="activity-list">
            @for (activity of activities(); track activity.id) {
              <a class="activity-item" [routerLink]="['/projects', activity.projectId]">
                <span class="activity-dot" [class]="'activity-dot ' + activity.kind"></span>
                <span class="activity-content"><span class="activity-type">{{ kindLabel(activity.kind) }} · {{ activity.createdAt | date:'MMM d' }}</span><strong>{{ activity.title }}</strong><span class="activity-project">{{ activity.projectTitle }}</span></span>
              </a>
            }
          </div>
        }
        <div class="activity-quote"><span aria-hidden="true">“</span><p>Progress is a collection of small things that are easy to miss.</p><small>YOUR FUTURE SELF WILL THANK YOU</small></div>
      </aside>
    </div>
  `,
  styles: `
    :host { display: block; }
    .intro-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; margin-bottom: 31px; }
    .intro-row .eyebrow { margin: 0 0 13px; }
    h1 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(2.5rem, 5vw, 4.15rem); font-weight: 400; letter-spacing: -.055em; line-height: .98; }
    h1 em { color: var(--coral); font-weight: 400; }
    .intro-copy { max-width: 455px; margin: 16px 0 0; color: var(--ink-soft); font-size: .94rem; line-height: 1.65; }
    .new-project { flex: 0 0 auto; margin-bottom: 5px; }
    .stats-strip { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-bottom: 40px; padding: 19px 50px 18px 20px; border: 1px solid var(--line); border-radius: 9px; background: #edeae1; }
    .stat { display: grid; grid-template-columns: 46px auto; align-items: center; column-gap: 10px; min-height: 43px; border-right: 1px solid #d9d5cb; }
    .stat:not(:first-child) { padding-left: 20px; }
    .stat:nth-child(4) { border-right: 0; }
    .stat .mono-label { grid-column: 1 / -1; margin-bottom: 3px; font-size: .57rem; }
    .stat strong { font-family: Georgia, serif; font-size: 1.55rem; font-weight: 400; letter-spacing: -.04em; }
    .stat small { align-self: center; color: var(--ink-soft); font-size: .74rem; }
    .stats-stamp { position: absolute; top: 14px; right: 18px; color: var(--coral); font-size: 1.12rem; }
    .content-columns { display: grid; grid-template-columns: minmax(0, 1fr) 272px; gap: 32px; align-items: start; }
    .section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 15px; margin-bottom: 15px; }
    .section-head .eyebrow { margin: 0 0 7px; font-size: .63rem; }
    h2 { display: flex; align-items: center; gap: 10px; margin: 0; font-family: Georgia, serif; font-size: 1.55rem; font-weight: 400; letter-spacing: -.035em; }
    .count { min-width: 23px; height: 23px; display: inline-grid; place-items: center; border-radius: 50%; color: var(--ink-soft); background: #e9e6de; font: 500 .68rem var(--mono); }
    .sort-note { color: #8b948d; font: .57rem var(--mono); letter-spacing: .06em; }
    .sort-note span { color: var(--coral); }
    .filters { display: flex; align-items: center; gap: 9px; padding: 8px; margin-bottom: 14px; }
    .search-field { min-width: 130px; display: flex; align-items: center; gap: 8px; flex: 1; padding-left: 7px; }
    .search-field svg { width: 16px; height: 16px; flex: 0 0 auto; fill: none; stroke: #929b94; stroke-width: 1.6; stroke-linecap: round; }
    .search-field input { width: 100%; min-width: 0; padding: 8px 0; border: 0; outline: none; color: var(--ink); background: transparent; font-size: .76rem; }
    .search-field input:focus { box-shadow: none; }
    .search-field input::placeholder { color: #969e98; }
    .filter-select select { min-height: 33px; max-width: 124px; padding: 0 22px 0 8px; border: 1px solid var(--line); border-radius: 5px; color: var(--ink-soft); background: #fffdf8; font-size: .69rem; }
    .reset-filter { padding: 6px 7px; border: 0; color: var(--coral); background: transparent; font-size: .69rem; cursor: pointer; }
    .reset-filter:disabled { color: #b9bdb8; cursor: default; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .project-list { display: grid; gap: 11px; }
    .project-card { display: grid; grid-template-columns: 36px minmax(0,1fr) 20px; gap: 12px; padding: 17px 16px 15px; transition: transform 170ms ease, box-shadow 170ms ease, border-color 170ms ease; }
    .project-card:hover { transform: translateY(-2px); border-color: #cbc9be; box-shadow: var(--shadow); }
    .card-index { width: 29px; height: 29px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; color: #929991; font: .62rem var(--mono); }
    .card-main { min-width: 0; }
    .title-row { display: flex; align-items: center; gap: 9px; }
    .title-row h3 { overflow: hidden; margin: 1px 0 0; font-size: .98rem; font-weight: 600; letter-spacing: -.02em; text-overflow: ellipsis; white-space: nowrap; }
    .status-pill { padding: 4px 7px; border-radius: 20px; font: .57rem var(--mono); white-space: nowrap; }
    .status-pill.planning { color: #7d6845; background: #f3ead9; }
    .status-pill.in_progress { color: #44684b; background: var(--fern-soft); }
    .status-pill.completed { color: #536d78; background: #e3edf0; }
    .status-pill.paused { color: #826c75; background: #eee6eb; }
    .project-description { overflow: hidden; margin: 6px 0 9px; color: var(--ink-soft); font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 5px; min-height: 21px; }
    .tech-tag { padding: 3px 7px; border: 1px solid #e6e2d8; border-radius: 4px; color: #69756d; background: #f9f7f1; font: .58rem var(--mono); }
    .public-tag { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; color: #4c6c53; font-size: .62rem; }
    .public-tag span { width: 5px; height: 5px; border-radius: 50%; background: #75a37f; }
    .progress-line { display: flex; align-items: center; gap: 8px; margin-top: 13px; }
    .progress-track { width: 90px; height: 4px; overflow: hidden; border-radius: 9px; background: #e8e7df; }
    .progress-track span { height: 100%; display: block; border-radius: inherit; background: var(--fern); transition: width 420ms ease; }
    .progress-number { color: #68766c; font: .59rem var(--mono); }
    .updated { margin-left: auto; color: #9ca39d; font-size: .65rem; }
    .card-arrow { padding-top: 2px; color: #a9afa9; font-size: .86rem; transition: color 150ms ease, transform 150ms ease; }
    .project-card:hover .card-arrow { transform: translate(2px,-2px); color: var(--coral); }
    .empty-state { padding: 39px 24px; text-align: center; }
    .empty-icon { width: 42px; height: 42px; display: inline-grid; place-items: center; border: 1px solid #d9ded6; border-radius: 50%; color: var(--fern); background: var(--fern-soft); font-size: 1.25rem; }
    .empty-state h3 { margin: 13px 0 7px; font-family: Georgia, serif; font-size: 1.4rem; font-weight: 400; }
    .empty-state p { max-width: 380px; margin: 0 auto 17px; color: var(--ink-soft); font-size: .82rem; line-height: 1.6; }
    .loading-list, .activity-loading { display: grid; gap: 11px; }
    .skeleton { height: 130px; border: 1px solid var(--line); border-radius: 9px; background: linear-gradient(100deg,#efede6 30%,#f8f6ef 50%,#efede6 70%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
    .activity-loading .skeleton { height: 82px; }
    @keyframes shimmer { to { background-position-x: -200%; } }
    .activity-head { min-height: 48px; }
    .activity-head h2 { font-size: 1.42rem; }
    .activity-mark { color: var(--coral); font-size: 1.05rem; }
    .activity-list { display: grid; }
    .activity-item { display: grid; grid-template-columns: 14px minmax(0,1fr); gap: 10px; padding: 14px 0; border-bottom: 1px solid var(--line); }
    .activity-dot { width: 9px; height: 9px; margin-top: 4px; border: 2px solid #fffdf8; border-radius: 50%; background: var(--fern); box-shadow: 0 0 0 1px #aab8a9; }
    .activity-dot.challenge { background: var(--coral); box-shadow: 0 0 0 1px #dda195; }
    .activity-dot.takeaway { background: var(--gold); box-shadow: 0 0 0 1px #cfb98e; }
    .activity-content { display: grid; gap: 5px; min-width: 0; }
    .activity-type { color: #9a9f97; font: .58rem var(--mono); letter-spacing: .03em; text-transform: uppercase; }
    .activity-content strong { overflow: hidden; font-size: .78rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .activity-project { color: var(--ink-soft); font-size: .7rem; }
    .activity-empty { padding: 15px 0 25px; color: var(--ink-soft); font-size: .79rem; line-height: 1.55; }
    .activity-empty .empty-icon { width: 34px; height: 34px; font-size: 1rem; }
    .activity-quote { margin-top: 24px; padding: 15px 16px 14px; border-left: 2px solid var(--coral); background: #efebe2; }
    .activity-quote > span { color: var(--coral); font-family: Georgia, serif; font-size: 2rem; line-height: .65; }
    .activity-quote p { margin: 4px 0 12px; font-family: Georgia, serif; font-size: .93rem; font-style: italic; line-height: 1.4; }
    .activity-quote small { color: #929890; font: .53rem var(--mono); letter-spacing: .07em; }
    .error-banner { margin-bottom: 16px; }
    @media (max-width: 1050px) { .content-columns { grid-template-columns: minmax(0, 1fr) 230px; gap: 23px; } .stat:not(:first-child) { padding-left: 14px; } .stats-strip { padding-right: 38px; } }
    @media (max-width: 850px) { .content-columns { grid-template-columns: 1fr; } .activity-section { margin-top: 12px; } .activity-list { grid-template-columns: repeat(2,minmax(0,1fr)); column-gap: 18px; } .activity-quote { max-width: 430px; } }
    @media (max-width: 620px) { .intro-row { align-items: flex-start; flex-direction: column; gap: 18px; } .intro-row h1 { font-size: 3rem; } .new-project { margin: 0; } .stats-strip { grid-template-columns: repeat(2,1fr); gap: 14px 0; padding: 16px 14px; } .stat { grid-template-columns: 42px auto; border-right: 0; } .stat:nth-child(odd) { border-right: 1px solid #d9d5cb; } .stat:not(:first-child) { padding-left: 0; } .stat:nth-child(even) { padding-left: 14px; } .stat .mono-label { font-size: .5rem; } .filters { flex-wrap: wrap; } .search-field { flex-basis: 100%; padding: 2px 7px 7px; border-bottom: 1px solid var(--line); } .filter-select { flex: 1; } .filter-select select { width: 100%; max-width: none; } .project-card { grid-template-columns: 28px minmax(0,1fr) 15px; gap: 8px; padding: 14px 11px; } .card-index { width: 25px; height: 25px; } .title-row { align-items: flex-start; flex-direction: column; gap: 5px; } .title-row h3 { max-width: 100%; } .project-description { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; } .activity-list { grid-template-columns: 1fr; } }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly projectsService = inject(ProjectsService);
  readonly projects = signal<ProjectRow[]>([]);
  readonly activities = signal<DashboardActivity[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly query = signal('');
  readonly statusFilter = signal<'all' | ProjectStatus>('all');
  readonly technologyFilter = signal('all');

  readonly technologies = computed(() => [...new Set(this.projects().flatMap((project) => project.technology_tags))].sort());
  readonly activeCount = computed(() => this.projects().filter((project) => project.status === 'in_progress').length);
  readonly completedCount = computed(() => this.projects().filter((project) => project.status === 'completed').length);
  readonly filteredProjects = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return this.projects().filter((project) => {
      const matchesStatus = this.statusFilter() === 'all' || project.status === this.statusFilter();
      const matchesTechnology = this.technologyFilter() === 'all' || project.technology_tags.includes(this.technologyFilter());
      const haystack = `${project.title} ${project.description} ${project.goals} ${project.technology_tags.join(' ')}`.toLocaleLowerCase();
      return matchesStatus && matchesTechnology && (!query || haystack.includes(query));
    });
  });
  readonly hasFilters = computed(() => Boolean(this.query() || this.statusFilter() !== 'all' || this.technologyFilter() !== 'all'));

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [projects, activities] = await Promise.all([
        this.projectsService.listProjects(),
        this.projectsService.recentActivity(5),
      ]);
      this.projects.set(projects);
      this.activities.set(activities);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Could not load your projects. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  resetFilters(): void { this.query.set(''); this.statusFilter.set('all'); this.technologyFilter.set('all'); }
  statusLabel(status: ProjectStatus): string { return ({ planning: 'Planning', in_progress: 'In progress', completed: 'Complete', paused: 'Paused' })[status]; }
  kindLabel(kind: string): string { return ({ work: 'Work log', challenge: 'Challenge', takeaway: 'Takeaway' })[kind] ?? 'Learning note'; }
}
