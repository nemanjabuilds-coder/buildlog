export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'paused';
export type LearningEntryKind = 'work' | 'challenge' | 'takeaway';
export type LearningEntryVisibility = 'private' | 'public';

export type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  goals: string;
  technology_tags: string[];
  status: ProjectStatus;
  progress: number;
  repository_url: string | null;
  demo_url: string | null;
  target_date: string | null;
  is_public: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

export type MilestoneRow = {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  notes: string;
  due_date: string | null;
  is_complete: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
};

export type LearningEntryRow = {
  id: string;
  project_id: string;
  owner_id: string;
  kind: LearningEntryKind;
  title: string;
  body: string;
  visibility: LearningEntryVisibility;
  created_at: string;
};

export type PublicPortfolioProject = Pick<ProjectRow,
  'title' | 'description' | 'goals' | 'technology_tags' | 'status' | 'progress' |
  'repository_url' | 'demo_url' | 'target_date' | 'created_at'>;

export type PublicPortfolioMilestone = Pick<MilestoneRow,
  'title' | 'notes' | 'due_date' | 'is_complete'>;

export type PublicPortfolioEntry = Pick<LearningEntryRow,
  'kind' | 'title' | 'body' | 'created_at'>;

export interface PublicPortfolioData {
  project: PublicPortfolioProject;
  milestones: PublicPortfolioMilestone[];
  entries: PublicPortfolioEntry[];
}

export type ProjectInsert = Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<Omit<ProjectInsert, 'owner_id'>>;
export type MilestoneInsert = Omit<MilestoneRow, 'id' | 'created_at'>;
export type LearningEntryInsert = Omit<LearningEntryRow, 'id' | 'created_at'>;

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: [];
      };
      milestones: {
        Row: MilestoneRow;
        Insert: MilestoneInsert;
        Update: Partial<Omit<MilestoneInsert, 'owner_id' | 'project_id'>>;
        Relationships: [];
      };
      learning_entries: {
        Row: LearningEntryRow;
        Insert: LearningEntryInsert;
        Update: Partial<Omit<LearningEntryInsert, 'owner_id' | 'project_id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_portfolio: {
        Args: { p_slug: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
