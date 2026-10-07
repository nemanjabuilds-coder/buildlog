import { Injectable, inject } from '@angular/core';
import { LearningEntryInsert, LearningEntryRow, MilestoneInsert, MilestoneRow, ProjectInsert, ProjectRow, ProjectUpdate, PublicPortfolioData } from '../models/database.types';
import { AuthService } from '../auth/auth.service';
import { supabaseClient } from './supabase-client';

export interface DashboardActivity {
  id: string;
  title: string;
  kind: string;
  body: string;
  createdAt: string;
  projectId: string;
  projectTitle: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly auth = inject(AuthService);
  private readonly client = supabaseClient;

  private getClient() {
    if (!this.client) throw new Error('Supabase is not configured yet.');
    return this.client;
  }

  private getOwnerId(): string {
    const id = this.auth.user()?.id;
    if (!id) throw new Error('Please sign in to continue.');
    return id;
  }

  async listProjects(): Promise<ProjectRow[]> {
    const { data, error } = await this.getClient()
      .from('projects')
      .select('*')
      .eq('owner_id', this.getOwnerId())
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getProject(id: string): Promise<ProjectRow | null> {
    const { data, error } = await this.getClient()
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', this.getOwnerId())
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createProject(input: Omit<ProjectInsert, 'owner_id'>): Promise<ProjectRow> {
    const { data, error } = await this.getClient()
      .from('projects')
      .insert({ ...input, owner_id: this.getOwnerId() })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateProject(id: string, input: ProjectUpdate): Promise<ProjectRow> {
    const { data, error } = await this.getClient()
      .from('projects')
      .update(input)
      .eq('id', id)
      .eq('owner_id', this.getOwnerId())
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async setProjectVisibility(project: ProjectRow, isPublic: boolean): Promise<ProjectRow> {
    const publicSlug = project.public_slug ?? `${slugify(project.title)}-${crypto.randomUUID().slice(0, 6)}`;
    return this.updateProject(project.id, { is_public: isPublic, public_slug: publicSlug });
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('owner_id', this.getOwnerId());
    if (error) throw error;
  }

  async listMilestones(projectId: string): Promise<MilestoneRow[]> {
    const { data, error } = await this.getClient()
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .eq('owner_id', this.getOwnerId())
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async createMilestone(projectId: string, input: Omit<MilestoneInsert, 'project_id' | 'owner_id'>): Promise<MilestoneRow> {
    const { data, error } = await this.getClient()
      .from('milestones')
      .insert({ ...input, project_id: projectId, owner_id: this.getOwnerId() })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateMilestone(id: string, input: Partial<Pick<MilestoneRow, 'is_complete' | 'is_public' | 'title' | 'notes' | 'due_date'>>): Promise<void> {
    const { error } = await this.getClient()
      .from('milestones')
      .update(input)
      .eq('id', id)
      .eq('owner_id', this.getOwnerId());
    if (error) throw error;
  }

  async deleteMilestone(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('milestones')
      .delete()
      .eq('id', id)
      .eq('owner_id', this.getOwnerId());
    if (error) throw error;
  }

  async listEntries(projectId: string): Promise<LearningEntryRow[]> {
    const { data, error } = await this.getClient()
      .from('learning_entries')
      .select('*')
      .eq('project_id', projectId)
      .eq('owner_id', this.getOwnerId())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async createEntry(projectId: string, input: Omit<LearningEntryInsert, 'project_id' | 'owner_id'>): Promise<LearningEntryRow> {
    const { data, error } = await this.getClient()
      .from('learning_entries')
      .insert({ ...input, project_id: projectId, owner_id: this.getOwnerId() })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteEntry(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('learning_entries')
      .delete()
      .eq('id', id)
      .eq('owner_id', this.getOwnerId());
    if (error) throw error;
  }

  async recentActivity(limit = 5): Promise<DashboardActivity[]> {
    const ownerId = this.getOwnerId();
    const client = this.getClient();
    const { data: entries, error } = await client
      .from('learning_entries')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (!entries?.length) return [];

    const projectIds = [...new Set(entries.map((entry) => entry.project_id))];
    const { data: projects, error: projectError } = await client
      .from('projects')
      .select('id, title')
      .in('id', projectIds);
    if (projectError) throw projectError;
    const titles = new Map((projects ?? []).map((project) => [project.id, project.title]));

    return entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      kind: entry.kind,
      body: entry.body,
      createdAt: entry.created_at,
      projectId: entry.project_id,
      projectTitle: titles.get(entry.project_id) ?? 'Learning project',
    }));
  }

  async publicPortfolio(slug: string): Promise<PublicPortfolioData | null> {
    const client = this.getClient();
    const { data, error } = await client.rpc('get_public_portfolio', { p_slug: slug });
    if (error) throw error;
    if (!data) return null;
    return data as unknown as PublicPortfolioData;
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'project';
}
