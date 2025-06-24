import { supabase } from '../config/supabase';
import type { BoardColumn, BoardColumnInsert, BoardColumnUpdate, ApiResponse } from '../types/supabase';

export class BoardColumnService {
  /**
   * Get all board columns for a project, ordered by position
   */
  static async getProjectColumns(projectId: string): Promise<ApiResponse<BoardColumn[]>> {
    try {
      const { data, error } = await supabase
        .from('board_columns')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching board columns:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Unexpected error fetching board columns:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while fetching board columns',
        success: false
      };
    }
  }

  /**
   * Create a new board column
   */
  static async createColumn(columnData: BoardColumnInsert): Promise<ApiResponse<BoardColumn>> {
    try {
      // Get the next position for this project
      const { data: existingColumns } = await supabase
        .from('board_columns')
        .select('position')
        .eq('project_id', columnData.project_id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingColumns && existingColumns.length > 0 
        ? existingColumns[0].position + 1 
        : 0;

      const { data, error } = await supabase
        .from('board_columns')
        .insert({
          ...columnData,
          position: columnData.position ?? nextPosition
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating board column:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Unexpected error creating board column:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while creating the board column',
        success: false
      };
    }
  }

  /**
   * Update a board column
   */
  static async updateColumn(columnId: string, updates: BoardColumnUpdate): Promise<ApiResponse<BoardColumn>> {
    try {
      const { data, error } = await supabase
        .from('board_columns')
        .update(updates)
        .eq('id', columnId)
        .select()
        .single();

      if (error) {
        console.error('Error updating board column:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Unexpected error updating board column:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while updating the board column',
        success: false
      };
    }
  }

  /**
   * Delete a board column
   * Note: This will set all tasks in this column to have null column_id
   */
  static async deleteColumn(columnId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('board_columns')
        .delete()
        .eq('id', columnId);

      if (error) {
        console.error('Error deleting board column:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Unexpected error deleting board column:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while deleting the board column',
        success: false
      };
    }
  }

  /**
   * Reorder board columns by updating their positions
   */
  static async reorderColumns(projectId: string, columnOrders: { id: string; position: number }[]): Promise<ApiResponse<BoardColumn[]>> {
    try {
      // Update positions in a transaction-like manner
      const updates = columnOrders.map(({ id, position }) =>
        supabase
          .from('board_columns')
          .update({ position })
          .eq('id', id)
          .eq('project_id', projectId)
      );

      const results = await Promise.all(updates);
      
      // Check if any updates failed
      const errors = results.filter((result: any) => result.error);
      if (errors.length > 0) {
        console.error('Error reordering board columns:', errors);
        return {
          data: null,
          error: 'Failed to reorder some columns',
          success: false
        };
      }

      // Fetch the updated columns
      return await this.getProjectColumns(projectId);
    } catch (error) {
      console.error('Unexpected error reordering board columns:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while reordering board columns',
        success: false
      };
    }
  }

  /**
   * Get a single board column by ID
   */
  static async getColumn(columnId: string): Promise<ApiResponse<BoardColumn>> {
    try {
      const { data, error } = await supabase
        .from('board_columns')
        .select('*')
        .eq('id', columnId)
        .single();

      if (error) {
        console.error('Error fetching board column:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Unexpected error fetching board column:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while fetching the board column',
        success: false
      };
    }
  }

  /**
   * Create default columns for a new project
   */
  static async createDefaultColumns(projectId: string): Promise<ApiResponse<BoardColumn[]>> {
    try {
      const defaultColumns: BoardColumnInsert[] = [
        {
          project_id: projectId,
          name: 'To Do',
          color: '#3b82f6', // Blue
          position: 0
        },
        {
          project_id: projectId,
          name: 'In Progress',
          color: '#f59e0b', // Amber
          position: 1
        },
        {
          project_id: projectId,
          name: 'Done',
          color: '#10b981', // Emerald
          position: 2
        }
      ];

      const { data, error } = await supabase
        .from('board_columns')
        .insert(defaultColumns)
        .select();

      if (error) {
        console.error('Error creating default board columns:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Unexpected error creating default board columns:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while creating default board columns',
        success: false
      };
    }
  }

  /**
   * Check if a column name already exists in a project
   */
  static async isColumnNameUnique(projectId: string, name: string, excludeColumnId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('board_columns')
        .select('id')
        .eq('project_id', projectId)
        .eq('name', name);

      if (excludeColumnId) {
        query = query.neq('id', excludeColumnId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking column name uniqueness:', error);
        return false;
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error('Unexpected error checking column name uniqueness:', error);
      return false;
    }
  }

  /**
   * Get tasks count for each column in a project
   */
  static async getColumnTaskCounts(projectId: string): Promise<ApiResponse<Record<string, number>>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('column_id')
        .eq('project_id', projectId)
        .not('column_id', 'is', null);

      if (error) {
        console.error('Error fetching column task counts:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Count tasks per column
      const counts: Record<string, number> = {};
      data?.forEach((task: any) => {
        if (task.column_id) {
          counts[task.column_id] = (counts[task.column_id] || 0) + 1;
        }
      });

      return {
        data: counts,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Unexpected error fetching column task counts:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while fetching column task counts',
        success: false
      };
    }
  }
}

export default BoardColumnService; 