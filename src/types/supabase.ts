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
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          project_id: string | null
          entity_type: string
          entity_id: string
          action: Database["public"]["Enums"]["activity_action"]
          details: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          project_id?: string | null
          entity_type: string
          entity_id: string
          action: Database["public"]["Enums"]["activity_action"]
          details?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          project_id?: string | null
          entity_type?: string
          entity_id?: string
          action?: Database["public"]["Enums"]["activity_action"]
          details?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_project_id_fkey"
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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
      comments: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          user_id: string
          content: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          user_id: string
          content: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          user_id?: string
          content?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      custom_permissions: {
        Row: {
          id: string
          user_id: string
          permission_id: string
          context_type: string
          context_id: string
          granted: boolean | null
          granted_by: string | null
          created_at: string | null
          project_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          permission_id: string
          context_type: string
          context_id: string
          granted?: boolean | null
          granted_by?: string | null
          created_at?: string | null
          project_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          permission_id?: string
          context_type?: string
          context_id?: string
          granted?: boolean | null
          granted_by?: string | null
          created_at?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_permissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      document_versions: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          version_number: number
          content: Json
          summary: string | null
          created_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          version_number: number
          content: Json
          summary?: string | null
          created_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          version_number?: number
          content?: Json
          summary?: string | null
          created_by?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      permissions: {
        Row: {
          id: string
          action: Database["public"]["Enums"]["permission_action"]
          name: string
          description: string | null
          category: string
          created_at: string | null
        }
        Insert: {
          id?: string
          action: Database["public"]["Enums"]["permission_action"]
          name: string
          description?: string | null
          category: string
          created_at?: string | null
        }
        Update: {
          id?: string
          action?: Database["public"]["Enums"]["permission_action"]
          name?: string
          description?: string | null
          category?: string
          created_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          role: string | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
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
          role: Database["public"]["Enums"]["member_role"] | null
          token: string
          invited_by: string | null
          expires_at: string
          accepted_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          email: string
          role?: Database["public"]["Enums"]["member_role"] | null
          token: string
          invited_by?: string | null
          expires_at: string
          accepted_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          email?: string
          role?: Database["public"]["Enums"]["member_role"] | null
          token?: string
          invited_by?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string | null
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
          role: Database["public"]["Enums"]["member_role"]
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: Database["public"]["Enums"]["member_role"]
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          created_at?: string
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
          title: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
          status: Database["public"]["Enums"]["project_status"] | null
          color: string | null
          is_template: boolean | null
          workspace_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          color?: string | null
          is_template?: boolean | null
          workspace_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          color?: string | null
          is_template?: boolean | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          title: string
          description: string | null
          completed: boolean | null
          order_index: number | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          description?: string | null
          completed?: boolean | null
          order_index?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          description?: string | null
          completed?: boolean | null
          order_index?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: Database["public"]["Enums"]["task_status"]
          due_date: string | null
          assignee_id: string | null
          created_by: string
          created_at: string
          updated_at: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          order_index: number | null
          estimated_hours: number | null
          actual_hours: number | null
          parent_task_id: string | null
          column_id: string | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          due_date?: string | null
          assignee_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          order_index?: number | null
          estimated_hours?: number | null
          actual_hours?: number | null
          parent_task_id?: string | null
          column_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          due_date?: string | null
          assignee_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          order_index?: number | null
          estimated_hours?: number | null
          actual_hours?: number | null
          parent_task_id?: string | null
          column_id?: string | null
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
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          }
        ]
      }
      version_history: {
        Row: {
          id: string
          version_id: string
          field_name: string
          old_value: Json | null
          new_value: Json | null
          change_type: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          version_id: string
          field_name: string
          old_value?: Json | null
          new_value?: Json | null
          change_type: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          version_id?: string
          field_name?: string
          old_value?: Json | null
          new_value?: Json | null
          change_type?: string
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "version_history_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "version_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: Database["public"]["Enums"]["workspace_role"] | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: Database["public"]["Enums"]["workspace_role"] | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["workspace_role"] | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          settings: Json | null
          subscription_tier: string | null
          subscription_expires_at: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          settings?: Json | null
          subscription_tier?: string | null
          subscription_expires_at?: string | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          settings?: Json | null
          subscription_tier?: string | null
          subscription_expires_at?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_document_version: {
        Args: {
          p_entity_type: string
          p_entity_id: string
          p_content: Json
          p_summary?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      activity_action: "created" | "updated" | "deleted" | "assigned" | "unassigned" | "completed" | "reopened" | "commented" | "invited" | "joined" | "archived" | "restored" | "status_changed" | "due_date_changed"
      member_role: "owner" | "admin" | "member"
      permission_action: "project.view" | "project.edit" | "project.delete" | "project.manage_members" | "project.manage_settings" | "project.archive" | "project.create_templates" | "task.view" | "task.create" | "task.edit" | "task.delete" | "task.assign" | "task.complete" | "task.comment" | "task.attach_files" | "team.view" | "team.edit" | "team.delete" | "team.manage_members" | "workspace.view" | "workspace.edit" | "workspace.manage_members" | "workspace.create_projects" | "workspace.manage_billing" | "project.view_presence" | "project.edit_collaborative" | "task.view_presence" | "task.edit_collaborative"
      priority_level: "low" | "medium" | "high" | "urgent"
      project_status: "active" | "archived" | "completed" | "template"
      task_status: "todo" | "in_progress" | "done"
      workspace_role: "owner" | "admin" | "member" | "billing_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Utility type for inferring the return type of a "Select" query
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    : never = never,
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
    : never = never,
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
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Export main table types
export type ActivityLog = Tables<"activity_logs">
export type ActivityLogInsert = TablesInsert<"activity_logs">
export type ActivityLogUpdate = TablesUpdate<"activity_logs">

export type Attachment = Tables<"attachments">
export type AttachmentInsert = TablesInsert<"attachments">
export type AttachmentUpdate = TablesUpdate<"attachments">

export type BoardColumn = Tables<"board_columns">
export type BoardColumnInsert = TablesInsert<"board_columns">
export type BoardColumnUpdate = TablesUpdate<"board_columns">

export type Comment = Tables<"comments">
export type CommentInsert = TablesInsert<"comments">
export type CommentUpdate = TablesUpdate<"comments">

export type CustomPermission = Tables<"custom_permissions">
export type CustomPermissionInsert = TablesInsert<"custom_permissions">
export type CustomPermissionUpdate = TablesUpdate<"custom_permissions">

export type DocumentVersion = Tables<"document_versions">
export type DocumentVersionInsert = TablesInsert<"document_versions">
export type DocumentVersionUpdate = TablesUpdate<"document_versions">

export type Permission = Tables<"permissions">
export type PermissionInsert = TablesInsert<"permissions">
export type PermissionUpdate = TablesUpdate<"permissions">

export type Profile = Tables<"profiles">
export type ProfileInsert = TablesInsert<"profiles">
export type ProfileUpdate = TablesUpdate<"profiles">

export type Project = Tables<"projects">
export type ProjectInsert = TablesInsert<"projects">
export type ProjectUpdate = TablesUpdate<"projects">

export type ProjectInvitation = Tables<"project_invitations">
export type ProjectInvitationInsert = TablesInsert<"project_invitations">
export type ProjectInvitationUpdate = TablesUpdate<"project_invitations">

export type ProjectMember = Tables<"project_members">
export type ProjectMemberInsert = TablesInsert<"project_members">
export type ProjectMemberUpdate = TablesUpdate<"project_members">

export type Subtask = Tables<"subtasks">
export type SubtaskInsert = TablesInsert<"subtasks">
export type SubtaskUpdate = TablesUpdate<"subtasks">

export type Task = Tables<"tasks">
export type TaskInsert = TablesInsert<"tasks">
export type TaskUpdate = TablesUpdate<"tasks">

export type VersionHistory = Tables<"version_history">
export type VersionHistoryInsert = TablesInsert<"version_history">
export type VersionHistoryUpdate = TablesUpdate<"version_history">

export type Workspace = Tables<"workspaces">
export type WorkspaceInsert = TablesInsert<"workspaces">
export type WorkspaceUpdate = TablesUpdate<"workspaces">

export type WorkspaceMember = Tables<"workspace_members">
export type WorkspaceMemberInsert = TablesInsert<"workspace_members">
export type WorkspaceMemberUpdate = TablesUpdate<"workspace_members">

// Export enum types
export type ActivityAction = Enums<"activity_action">
export type MemberRole = Enums<"member_role">
export type PermissionAction = Enums<"permission_action">
export type PriorityLevel = Enums<"priority_level">
export type ProjectStatus = Enums<"project_status">
export type TaskStatus = Enums<"task_status">
export type WorkspaceRole = Enums<"workspace_role">

// Custom response types that services expect
export interface ApiResponse<T> {
  data?: T | null
  error?: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[] | null
  pagination?: {
    totalCount?: number
    page: number
    pageSize?: number
    hasMore: boolean
    limit?: number
    total?: number
  }
  totalCount?: number
  page?: number
  pageSize?: number
  hasMore?: boolean
  success?: boolean
  error?: string | null
}

// Additional custom types for enhanced functionality
export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[]
}

export interface ProjectWithMembers extends Project {
  project_members?: ProjectMember[]
  members?: ProjectMember[]
  owner?: Profile
}

export interface ProjectWithTasks extends Project {
  tasks: Task[]
  columns: BoardColumn[]
}

export interface CommentWithAuthor extends Comment {
  author: Profile
}

export interface InvitationWithDetails extends ProjectInvitation {
  project: Project
  inviter: Profile
}

export interface SharedDocument {
  id: string
  entity_type: string
  entity_id: string
  share_token: string
  access_level: string
  expires_at: string | null
  shared_by: string
  shared_with: string | null
  created_at: string
}

// Legacy permission type for backward compatibility
export type LegacyPermission = string | PermissionAction
