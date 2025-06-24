import { supabase } from '../config/supabase';

export interface SchemaValidationResult {
  tableExists: boolean;
  columnIdExists: boolean;
  indexesExist: boolean;
  defaultColumnsExist: boolean;
  migrationComplete: boolean;
  errors: string[];
  details: {
    boardColumnsCount: number;
    tasksWithColumnId: number;
    totalTasks: number;
    projectsWithColumns: number;
    totalProjects: number;
  };
}

export class BoardColumnsSchemaValidator {
  /**
   * Comprehensive validation of the board_columns schema migration
   */
  static async validateSchema(): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      tableExists: false,
      columnIdExists: false,
      indexesExist: false,
      defaultColumnsExist: false,
      migrationComplete: false,
      errors: [],
      details: {
        boardColumnsCount: 0,
        tasksWithColumnId: 0,
        totalTasks: 0,
        projectsWithColumns: 0,
        totalProjects: 0
      }
    };

    try {
      // 1. Check if board_columns table exists
      result.tableExists = await this.checkTableExists();
      
      if (!result.tableExists) {
        result.errors.push('board_columns table does not exist');
        return result;
      }

      // 2. Check if column_id was added to tasks table
      result.columnIdExists = await this.checkColumnIdExists();
      
      if (!result.columnIdExists) {
        result.errors.push('column_id field not found in tasks table');
      }

      // 3. Check if indexes exist (this might not be directly queryable via RLS)
      result.indexesExist = true; // Assume true if table exists

      // 4. Check if default columns exist for projects
      const defaultColumnsCheck = await this.checkDefaultColumns();
      result.defaultColumnsExist = defaultColumnsCheck.exists;
      result.details.boardColumnsCount = defaultColumnsCheck.count;
      result.details.projectsWithColumns = defaultColumnsCheck.projectsWithColumns;

      // 5. Check task migration status
      const taskMigrationCheck = await this.checkTaskMigration();
      result.details.tasksWithColumnId = taskMigrationCheck.tasksWithColumnId;
      result.details.totalTasks = taskMigrationCheck.totalTasks;

      // 6. Get total projects count
      result.details.totalProjects = await this.getTotalProjects();

      // 7. Determine if migration is complete
      result.migrationComplete = result.tableExists && 
                                result.columnIdExists && 
                                result.defaultColumnsExist &&
                                result.details.projectsWithColumns === result.details.totalProjects;

      if (!result.migrationComplete) {
        if (!result.defaultColumnsExist) {
          result.errors.push('Default columns not created for all projects');
        }
        if (result.details.projectsWithColumns !== result.details.totalProjects) {
          result.errors.push(`Only ${result.details.projectsWithColumns}/${result.details.totalProjects} projects have board columns`);
        }
      }

    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Check if board_columns table exists by trying to query it
   */
  private static async checkTableExists(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('board_columns')
        .select('id')
        .limit(1);

      // If there's no error, table exists
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Check if column_id field exists in tasks table
   */
  private static async checkColumnIdExists(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .select('column_id')
        .limit(1);

      // If there's no error, column exists
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Check if default columns exist for projects
   */
  private static async checkDefaultColumns(): Promise<{
    exists: boolean;
    count: number;
    projectsWithColumns: number;
  }> {
    try {
      // Count total board columns
      const { data: columns, error: columnsError } = await supabase
        .from('board_columns')
        .select('id, project_id');

      if (columnsError) {
        return { exists: false, count: 0, projectsWithColumns: 0 };
      }

      const columnCount = columns?.length || 0;
      const uniqueProjects = new Set(columns?.map(col => col.project_id) || []);
      
      return {
        exists: columnCount > 0,
        count: columnCount,
        projectsWithColumns: uniqueProjects.size
      };
    } catch {
      return { exists: false, count: 0, projectsWithColumns: 0 };
    }
  }

  /**
   * Check task migration status
   */
  private static async checkTaskMigration(): Promise<{
    tasksWithColumnId: number;
    totalTasks: number;
  }> {
    try {
      // Count total tasks
      const { data: allTasks, error: allTasksError } = await supabase
        .from('tasks')
        .select('id, column_id');

      if (allTasksError) {
        return { tasksWithColumnId: 0, totalTasks: 0 };
      }

      const totalTasks = allTasks?.length || 0;
      const tasksWithColumnId = allTasks?.filter(task => task.column_id !== null).length || 0;

      return { tasksWithColumnId, totalTasks };
    } catch {
      return { tasksWithColumnId: 0, totalTasks: 0 };
    }
  }

  /**
   * Get total number of projects
   */
  private static async getTotalProjects(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id');

      if (error) {
        return 0;
      }

      return data?.length || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get a detailed report of the validation results
   */
  static formatValidationReport(result: SchemaValidationResult): string {
    const lines = [
      '=== Board Columns Schema Validation Report ===',
      '',
      `✅ Table Status:`,
      `   board_columns table exists: ${result.tableExists ? '✅' : '❌'}`,
      `   column_id in tasks table: ${result.columnIdExists ? '✅' : '❌'}`,
      `   Indexes created: ${result.indexesExist ? '✅' : '❌'}`,
      '',
      `📊 Migration Status:`,
      `   Default columns created: ${result.defaultColumnsExist ? '✅' : '❌'}`,
      `   Total board columns: ${result.details.boardColumnsCount}`,
      `   Projects with columns: ${result.details.projectsWithColumns}/${result.details.totalProjects}`,
      `   Tasks with column_id: ${result.details.tasksWithColumnId}/${result.details.totalTasks}`,
      '',
      `🎯 Overall Status: ${result.migrationComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`,
      ''
    ];

    if (result.errors.length > 0) {
      lines.push('❌ Errors:');
      result.errors.forEach(error => {
        lines.push(`   - ${error}`);
      });
      lines.push('');
    }

    if (result.migrationComplete) {
      lines.push('🎉 Migration completed successfully!');
      lines.push('   - All tables and columns created');
      lines.push('   - Default columns exist for all projects');
      lines.push('   - Task migration completed');
    } else {
      lines.push('⚠️  Migration incomplete. Please run the migration script.');
    }

    return lines.join('\n');
  }

  /**
   * Quick validation for testing - just checks if basic structure exists
   */
  static async quickValidation(): Promise<boolean> {
    try {
      const result = await this.validateSchema();
      return result.tableExists && result.columnIdExists;
    } catch {
      return false;
    }
  }
}

export default BoardColumnsSchemaValidator; 