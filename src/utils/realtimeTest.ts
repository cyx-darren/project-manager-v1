import { realtimeService, type RealtimeEvent } from '../services/realtimeService';
import { collaborationService } from '../services/collaborationService';
import { taskService } from '../services/taskService';

/**
 * Test real-time subscriptions and events
 */
export async function testRealtimeSubscriptions(projectId: string): Promise<void> {
  console.log('🔄 Testing real-time subscriptions...');
  
  const events: RealtimeEvent[] = [];
  
  // Event handler to capture events
  const eventHandler = (event: RealtimeEvent) => {
    events.push(event);
    console.log(`📡 Real-time event received:`, event);
  };

  try {
    // Subscribe to project updates
    await realtimeService.subscribeToProject(projectId, eventHandler);
    console.log(`✅ Subscribed to project: ${projectId}`);

    // Test creating a task (should trigger real-time event)
    console.log('🔄 Creating test task to trigger real-time event...');
    const taskResponse = await taskService.createTask({
      title: `Real-time Test Task ${Date.now()}`,
      description: 'This task was created to test real-time functionality',
      project_id: projectId,
      status: 'todo',
      priority: 'medium'
    });

    if (taskResponse.success && taskResponse.data) {
      console.log(`✅ Task created: ${taskResponse.data.title}`);
      
      // Wait a moment for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test adding a comment (should trigger real-time event)
      console.log('🔄 Adding comment to trigger real-time event...');
      await collaborationService.addComment({
        entity_id: taskResponse.data.id,
        entity_type: 'task',
        content: `Real-time test comment ${Date.now()}`
      });
      
      // Wait a moment for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test logging activity (should trigger real-time event)
      console.log('🔄 Logging activity to trigger real-time event...');
      await collaborationService.logActivity({
        project_id: projectId,
        entity_id: taskResponse.data.id,
        entity_type: 'task',
        action: 'created',
        details: { message: 'Real-time test activity' }
      });
      
      // Wait a moment for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Check if events were received
    console.log(`📊 Total real-time events received: ${events.length}`);
    events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.type} on ${event.table}`);
    });

    if (events.length > 0) {
      console.log('✅ Real-time functionality is working!');
    } else {
      console.log('⚠️ No real-time events received - check Supabase real-time settings');
    }

  } catch (error) {
    console.error('❌ Real-time test failed:', error);
  } finally {
    // Clean up subscription
    await realtimeService.unsubscribeFromProject(projectId);
    console.log('🧹 Unsubscribed from real-time updates');
  }
}

/**
 * Test real-time connection status
 */
export function testRealtimeConnection(): void {
  console.log('🔄 Testing real-time connection...');
  
  const status = realtimeService.getConnectionStatus();
  console.log(`📡 Connection status: ${status}`);
  
  const subscriptions = realtimeService.getActiveSubscriptions();
  console.log(`📊 Active subscriptions: ${subscriptions.length}`);
  subscriptions.forEach(sub => console.log(`  - ${sub}`));
}

/**
 * Test global real-time activity
 */
export async function testGlobalRealtimeActivity(): Promise<void> {
  console.log('🔄 Testing global real-time activity...');
  
  const events: RealtimeEvent[] = [];
  
  // Event handler to capture events
  const eventHandler = (event: RealtimeEvent) => {
    events.push(event);
    console.log(`🌍 Global real-time event received:`, event);
  };

  try {
    // Subscribe to global activity
    await realtimeService.subscribeToGlobalActivity(eventHandler);
    console.log('✅ Subscribed to global activity');

    // Test getting recent activity to see if there's any data
    const activityResponse = await collaborationService.getRecentActivity(5);
    if (activityResponse.success && activityResponse.data) {
      console.log(`📊 Found ${activityResponse.data.length} recent activities`);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`📊 Global events received: ${events.length}`);

  } catch (error) {
    console.error('❌ Global real-time test failed:', error);
  } finally {
    // Clean up subscription
    await realtimeService.unsubscribeFromGlobalActivity();
    console.log('🧹 Unsubscribed from global activity');
  }
}

/**
 * Run comprehensive real-time tests
 */
export async function runRealtimeTests(projectId?: string): Promise<void> {
  console.log('🚀 Starting comprehensive real-time tests...');
  
  // Test connection status
  testRealtimeConnection();
  
  // Test global activity if no project specified
  if (!projectId) {
    await testGlobalRealtimeActivity();
    console.log('ℹ️ Provide a project ID to test project-specific real-time features');
    return;
  }
  
  // Test project-specific real-time functionality
  await testRealtimeSubscriptions(projectId);
  
  // Test global activity
  await testGlobalRealtimeActivity();
  
  console.log('🎉 Real-time tests completed!');
} 