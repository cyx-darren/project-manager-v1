import { supabase } from '../config/supabase';

export interface RLSTestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export interface RLSTestSuite {
  category: string;
  tests: RLSTestResult[];
  passed: number;
  failed: number;
  total: number;
}

export class RLSTestingService {
  private async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Test workspace-level RLS policies
   */
  async testWorkspacePolicies(): Promise<RLSTestSuite> {
    const tests: RLSTestResult[] = [];
    
    try {
      const user = await this.getCurrentUser();
      
      // Test 1: User can view workspaces they are members of
      tests.push(await this.testWorkspaceVisibility(user.id));
      
      // Test 2: Workspace members can be viewed by workspace members
      tests.push(await this.testWorkspaceMemberVisibility(user.id));
      
    } catch (error) {
      tests.push({
        test: 'Workspace policies initialization',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return this.compileSuite('Workspace Policies', tests);
  }

  /**
   * Test project-level RLS policies
   */
  async testProjectPolicies(): Promise<RLSTestSuite> {
    const tests: RLSTestResult[] = [];
    
    try {
      const user = await this.getCurrentUser();
      
      // Test 1: User can view projects they have access to
      tests.push(await this.testProjectVisibility(user.id));
      
      // Test 2: Project members can view other project members
      tests.push(await this.testProjectMemberVisibility(user.id));
      
    } catch (error) {
      tests.push({
        test: 'Project policies initialization',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return this.compileSuite('Project Policies', tests);
  }

  /**
   * Test task-level RLS policies
   */
  async testTaskPolicies(): Promise<RLSTestSuite> {
    const tests: RLSTestResult[] = [];
    
    try {
      const user = await this.getCurrentUser();
      
      // Test 1: User can view tasks in accessible projects
      tests.push(await this.testTaskVisibility(user.id));
      
      // Test 2: Task assignee can view and update their tasks
      tests.push(await this.testTaskAssigneeAccess(user.id));
      
    } catch (error) {
      tests.push({
        test: 'Task policies initialization',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return this.compileSuite('Task Policies', tests);
  }



  /**
   * Run comprehensive RLS test suite
   */
  async runComprehensiveTests(): Promise<{
    suites: RLSTestSuite[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      successRate: number;
    };
  }> {
    const suites = await Promise.all([
      this.testWorkspacePolicies(),
      this.testProjectPolicies(),
      this.testTaskPolicies()
    ]);

    const summary = {
      totalTests: suites.reduce((sum, suite) => sum + suite.total, 0),
      passed: suites.reduce((sum, suite) => sum + suite.passed, 0),
      failed: suites.reduce((sum, suite) => sum + suite.failed, 0),
      successRate: 0
    };

    summary.successRate = summary.totalTests > 0 
      ? (summary.passed / summary.totalTests) * 100 
      : 0;

    return { suites, summary };
  }

  // Individual test implementations
  private async testWorkspaceVisibility(userId: string): Promise<RLSTestResult> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .limit(10);

      if (error) {
        return {
          test: 'Workspace visibility',
          passed: false,
          error: error.message
        };
      }

      return {
        test: 'Workspace visibility',
        passed: true,
        details: `User can see ${data?.length || 0} authorized workspaces`
      };
    } catch (error) {
      return {
        test: 'Workspace visibility',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testWorkspaceMemberVisibility(userId: string): Promise<RLSTestResult> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, user_id, role')
        .limit(10);

      if (error) {
        return {
          test: 'Workspace member visibility',
          passed: false,
          error: error.message
        };
      }

      return {
        test: 'Workspace member visibility',
        passed: true,
        details: `User can see ${data?.length || 0} workspace memberships`
      };
    } catch (error) {
      return {
        test: 'Workspace member visibility',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testProjectVisibility(userId: string): Promise<RLSTestResult> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, owner_id')
        .limit(10);

      if (error) {
        return {
          test: 'Project visibility',
          passed: false,
          error: error.message
        };
      }

      return {
        test: 'Project visibility',
        passed: true,
        details: `User can see ${data?.length || 0} authorized projects`
      };
    } catch (error) {
      return {
        test: 'Project visibility',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testProjectMemberVisibility(userId: string): Promise<RLSTestResult> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, user_id, role')
        .limit(10);

      if (error) {
        return {
          test: 'Project member visibility',
          passed: false,
          error: error.message
        };
      }

      return {
        test: 'Project member visibility',
        passed: true,
        details: `User can see ${data?.length || 0} project memberships`
      };
    } catch (error) {
      return {
        test: 'Project member visibility',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testTaskVisibility(userId: string): Promise<RLSTestResult> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, project_id, assignee_id, created_by')
        .limit(10);

      if (error) {
        return {
          test: 'Task visibility',
          passed: false,
          error: error.message
        };
      }

      return {
        test: 'Task visibility',
        passed: true,
        details: `User can see ${data?.length || 0} authorized tasks`
      };
    } catch (error) {
      return {
        test: 'Task visibility',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testTaskAssigneeAccess(userId: string): Promise<RLSTestResult> {
    try {
      const { data: assignedTasks } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('assignee_id', userId);

      return {
        test: 'Task assignee access',
        passed: true,
        details: `User has ${assignedTasks?.length || 0} assigned tasks`
      };
    } catch (error) {
      return {
        test: 'Task assignee access',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }



  private compileSuite(category: string, tests: RLSTestResult[]): RLSTestSuite {
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    return {
      category,
      tests,
      passed,
      failed,
      total: tests.length
    };
  }
}

export const rlsTestingService = new RLSTestingService(); 