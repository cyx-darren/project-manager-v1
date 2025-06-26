import { supabase } from '../config/supabase';
import type { Database } from '../types/supabase';

export type DocumentVersion = Database['public']['Tables']['document_versions']['Row'];
export type VersionHistory = Database['public']['Tables']['version_history']['Row'];

export interface VersionComparison {
  field_name: string;
  old_value: any;
  new_value: any;
  change_type: string;
}

export interface VersionHistoryEntry {
  version: DocumentVersion;
  changes: VersionHistory[];
}

export class VersionHistoryService {
  /**
   * Get all versions for a specific entity
   */
  async getVersionHistory(entityType: string, entityId: string): Promise<VersionHistoryEntry[]> {
    try {
      // Get all versions for the entity
      const { data: versions, error: versionsError } = await supabase
        .from('document_versions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('version_number', { ascending: false });

      if (versionsError) throw versionsError;
      if (!versions || versions.length === 0) return [];

      // Get all version history entries for these versions
      const versionIds = versions.map((v: DocumentVersion) => v.id);
      const { data: changes, error: changesError } = await supabase
        .from('version_history')
        .select('*')
        .in('version_id', versionIds)
        .order('created_at', { ascending: true });

      if (changesError) throw changesError;

      // Group changes by version
      const versionHistoryMap = new Map<string, VersionHistory[]>();
      changes?.forEach((change: VersionHistory) => {
        const versionChanges = versionHistoryMap.get(change.version_id) || [];
        versionChanges.push(change);
        versionHistoryMap.set(change.version_id, versionChanges);
      });

      // Combine versions with their changes
      return versions.map((version: DocumentVersion) => ({
        version,
        changes: versionHistoryMap.get(version.id) || []
      }));
    } catch (error) {
      console.error('Error getting version history:', error);
      throw error;
    }
  }

  /**
   * Get a specific version by version number
   */
  async getVersion(entityType: string, entityId: string, versionNumber: number): Promise<DocumentVersion | null> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('version_number', versionNumber)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting version:', error);
      throw error;
    }
  }

  /**
   * Compare two versions and return the differences
   */
  async compareVersions(
    entityType: string, 
    entityId: string, 
    fromVersion: number, 
    toVersion: number
  ): Promise<VersionComparison[]> {
    try {
      // Get both versions
      const [fromDoc, toDoc] = await Promise.all([
        this.getVersion(entityType, entityId, fromVersion),
        this.getVersion(entityType, entityId, toVersion)
      ]);

      if (!fromDoc || !toDoc) {
        throw new Error('One or both versions not found');
      }

      // Compare the content
      const differences: VersionComparison[] = [];
      const fromContent = fromDoc.content as Record<string, any>;
      const toContent = toDoc.content as Record<string, any>;

      // Get all unique field names from both versions
      const allFields = new Set([
        ...Object.keys(fromContent || {}),
        ...Object.keys(toContent || {})
      ]);

      allFields.forEach(field => {
        const oldValue = fromContent?.[field];
        const newValue = toContent?.[field];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          let changeType = 'modified';
          if (oldValue === undefined) changeType = 'added';
          if (newValue === undefined) changeType = 'deleted';

          differences.push({
            field_name: field,
            old_value: oldValue,
            new_value: newValue,
            change_type: changeType
          });
        }
      });

      return differences;
    } catch (error) {
      console.error('Error comparing versions:', error);
      throw error;
    }
  }

  /**
   * Create a new version of a document
   */
  async createVersion(
    entityType: string,
    entityId: string,
    content: Record<string, any>,
    summary: string,
    userId: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_document_version', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_content: content,
        p_summary: summary,
        p_user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(
    entityType: string,
    entityId: string,
    targetVersion: number,
    userId: string,
    summary?: string
  ): Promise<string> {
    try {
      // Get the target version content
      const targetDoc = await this.getVersion(entityType, entityId, targetVersion);
      if (!targetDoc) {
        throw new Error(`Version ${targetVersion} not found`);
      }

      // Create a new version with the target content
      const rollbackSummary = summary || `Rolled back to version ${targetVersion}`;
      return await this.createVersion(
        entityType,
        entityId,
        targetDoc.content as Record<string, any>,
        rollbackSummary,
        userId
      );
    } catch (error) {
      console.error('Error rolling back to version:', error);
      throw error;
    }
  }

  /**
   * Get the latest version number for an entity
   */
  async getLatestVersionNumber(entityType: string, entityId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.version_number || 0;
    } catch (error) {
      console.error('Error getting latest version number:', error);
      return 0;
    }
  }

  /**
   * Check if an entity has version history
   */
  async hasVersionHistory(entityType: string, entityId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('document_versions')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking version history:', error);
      return false;
    }
  }

  /**
   * Delete old versions (keep only the latest N versions)
   */
  async cleanupOldVersions(entityType: string, entityId: string, keepCount: number = 10): Promise<void> {
    try {
      // Get all versions ordered by version number (newest first)
      const { data: versions, error: versionsError } = await supabase
        .from('document_versions')
        .select('id, version_number')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('version_number', { ascending: false });

      if (versionsError) throw versionsError;
      if (!versions || versions.length <= keepCount) return;

      // Get versions to delete (everything after keepCount)
      const versionsToDelete = versions.slice(keepCount);
      const idsToDelete = versionsToDelete.map((v: DocumentVersion) => v.id);

      // Delete version history entries first (foreign key constraint)
      await supabase
        .from('version_history')
        .delete()
        .in('version_id', idsToDelete);

      // Then delete the versions
      await supabase
        .from('document_versions')
        .delete()
        .in('id', idsToDelete);

    } catch (error) {
      console.error('Error cleaning up old versions:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const versionHistoryService = new VersionHistoryService(); 