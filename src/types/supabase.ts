export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          action: string
          entity_type: string
          entity_id: string
          details: Json | null
          user_id: string
          project_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          action: string
          entity_type: string
          entity_id: string
          details?: Json | null
          user_id: string
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          action?: string
          entity_type?: string
          entity_id?: string
          details?: Json | null
          user_id?: string
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      attachments: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          user_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          user_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          user_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          storage_path?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      board_columns: {
        Row: {
          id: string
          project_id: string
          name: string
          color: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          color?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          color?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_columns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      columns: {
        Row: {
          id: string
          title: string
          position: number
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          position: number
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          position?: number
          project_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "columns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          content: string
          task_id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          task_id: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          task_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_invitations: {
        Row: {
          id: string
          project_id: string
          email: string
          role: MemberRole
          invited_by: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          email: string
          role: MemberRole
          invited_by: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          email?: string
          role?: MemberRole
          invited_by?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: MemberRole
          invited_by: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: MemberRole
          invited_by?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: MemberRole
          invited_by?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          title: string
          description: string | null
          owner_id: string
          team_id: string | null
          status: ProjectStatus
          is_template: boolean
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          title?: string
          description?: string | null
          owner_id: string
          team_id?: string | null
          status?: ProjectStatus
          is_template?: boolean
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          title?: string
          description?: string | null
          owner_id?: string
          team_id?: string | null
          status?: ProjectStatus
          is_template?: boolean
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: TaskStatus
          priority: TaskPriority
          due_date: string | null
          assigned_to: string | null
          assignee_id: string | null
          project_id: string
          column_id: string | null
          parent_task_id: string | null
          position: number
          order_index: number
          estimated_hours: number | null
          actual_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          assigned_to?: string | null
          assignee_id?: string | null
          project_id: string
          column_id?: string | null
          parent_task_id?: string | null
          position?: number
          order_index?: number
          estimated_hours?: number | null
          actual_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          assigned_to?: string | null
          assignee_id?: string | null
          project_id?: string
          column_id?: string | null
          parent_task_id?: string | null
          position?: number
          order_index?: number
          estimated_hours?: number | null
          actual_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          id: string
          email: string
          role: WorkspaceRole
          project_id: string | null
          invited_by: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: WorkspaceRole
          project_id?: string | null
          invited_by: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: WorkspaceRole
          project_id?: string | null
          invited_by?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_priority: TaskPriority
      task_status: TaskStatus
      project_status: ProjectStatus
      workspace_role: WorkspaceRole
      activity_action: ActivityAction
      member_role: MemberRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier usage
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Enum types
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ProjectStatus = 'active' | 'archived' | 'completed' | 'template'
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned' | 'completed' | 'reopened' | 'commented' | 'invited' | 'joined' | 'archived' | 'restored' | 'status_changed' | 'due_date_changed'
export type MemberRole = 'owner' | 'admin' | 'member'

// Enhanced types for complex queries
export type EnhancedActivity = Database['public']['Tables']['activities']['Row'] & {
  user?: Database['public']['Tables']['users']['Row']
  project?: Database['public']['Tables']['projects']['Row']
}

export type ActivityWithDetails = Database['public']['Tables']['activities']['Row'] & {
  user: Database['public']['Tables']['users']['Row']
}

export type InvitationWithDetails = Database['public']['Tables']['workspace_invitations']['Row'] & {
  invited_by_user?: Database['public']['Tables']['users']['Row']
  project?: Database['public']['Tables']['projects']['Row']
}

export type CommentWithAuthor = Database['public']['Tables']['comments']['Row'] & {
  user: Database['public']['Tables']['users']['Row']
}

export type TaskWithDetails = Database['public']['Tables']['tasks']['Row'] & {
  assigned_user?: Database['public']['Tables']['users']['Row']
  project?: Database['public']['Tables']['projects']['Row']
  column?: Database['public']['Tables']['columns']['Row']
  parent_task?: Database['public']['Tables']['tasks']['Row']
  subtasks?: Database['public']['Tables']['tasks']['Row'][]
  comments?: CommentWithAuthor[]
}

export type ProjectWithDetails = Database['public']['Tables']['projects']['Row'] & {
  owner?: Database['public']['Tables']['users']['Row']
  members?: (Database['public']['Tables']['project_members']['Row'] & {
    user: Database['public']['Tables']['users']['Row']
  })[]
  tasks?: TaskWithDetails[]
  columns?: Database['public']['Tables']['columns']['Row'][]
}

export type ProjectWithMembers = ProjectWithDetails

export type ColumnWithTasks = Database['public']['Tables']['columns']['Row'] & {
  tasks?: TaskWithDetails[]
}

// Re-export types for backward compatibility
export type Task = Database['public']['Tables']['tasks']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Column = Database['public']['Tables']['columns']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type ProjectMember = Database['public']['Tables']['project_members']['Row']
export type ProjectInvitation = Database['public']['Tables']['project_invitations']['Row']
export type WorkspaceInvitation = Database['public']['Tables']['workspace_invitations']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type BoardColumn = Database['public']['Tables']['board_columns']['Row']
