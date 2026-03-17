// Storage service for PromptSharp using Dexie.js for IndexedDB access
import Dexie from 'dexie';

// Define database schema
class PromptSharpDB extends Dexie {
  constructor() {
    super('PromptSharpDB');
    
    // Define database schema
    this.version(1).stores({
      prompts: '++id, original, optimized, timestamp, category, tags, isFavorite, guardrailsActivated',
      settings: 'key, value',
      models: 'id, name, provider, updated'
    });
  }
}

// Initialize database instance
const db = new PromptSharpDB();

// Storage key constants
const API_KEY_SETTING = 'api_key';
const SELECTED_MODEL_SETTING = 'selected_model';
const MODELS_CACHE_SETTING = 'models_cache';
const MODELS_CACHE_TIMESTAMP = 'models_cache_timestamp';
const MAX_SAVED_PROMPTS = 100;

/**
 * Get all saved prompts from database
 * @returns {Promise<Array>} Array of saved prompts
 */
export async function getSavedPrompts() {
  try {
    const prompts = await db.prompts
      .orderBy('timestamp')
      .reverse()
      .toArray();
    return prompts;
  } catch (error) {
    console.error('Error getting saved prompts:', error);
    return [];
  }
}

/**
 * Save a prompt to the database
 * @param {Object} promptData - The prompt data to save
 * @returns {Promise<boolean>} Success status
 */
export async function savePrompt(promptData) {
  try {
    // Check if we've reached the maximum number of saved prompts
    const count = await db.prompts.count();
    
    if (count >= MAX_SAVED_PROMPTS) {
      // Get the oldest prompts
      const oldestPrompts = await db.prompts
        .orderBy('timestamp')
        .limit(count - MAX_SAVED_PROMPTS + 1)
        .toArray();
        
      // Delete the oldest prompts
      for (const prompt of oldestPrompts) {
        await db.prompts.delete(prompt.id);
      }
    }
    
    // Add new prompt with metadata
    const newPrompt = {
      timestamp: new Date().toISOString(),
      original: promptData.original,
      optimized: promptData.optimized,
      category: promptData.category || 'General',
      tags: promptData.tags || [],
      isFavorite: promptData.isFavorite || false,
      guardrailsActivated: promptData.guardrailsActivated || false
    };
    
    await db.prompts.add(newPrompt);
    return true;
  } catch (error) {
    console.error('Error saving prompt:', error);
    return false;
  }
}

/**
 * Delete a prompt from the database
 * @param {number} promptId - The ID of the prompt to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deletePrompt(promptId) {
  try {
    await db.prompts.delete(promptId);
    return true;
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return false;
  }
}

/**
 * Search saved prompts
 * @param {string} query - The search query
 * @returns {Promise<Array>} Filtered prompts matching the query
 */
export async function searchPrompts(query) {
  if (!query) return getSavedPrompts();
  
  try {
    const lowerQuery = query.toLowerCase();
    
    const prompts = await db.prompts
      .filter(prompt => 
        prompt.original.toLowerCase().includes(lowerQuery) || 
        prompt.optimized.toLowerCase().includes(lowerQuery)
      )
      .toArray();
      
    return prompts;
  } catch (error) {
    console.error('Error searching prompts:', error);
    return [];
  }
}

/**
 * Export all saved prompts as JSON
 * @returns {Promise<string>} JSON string of all prompts
 */
export async function exportPrompts() {
  try {
    const prompts = await db.prompts.toArray();
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalPrompts: prompts.length,
      prompts: prompts
    };
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting prompts:', error);
    return '[]';
  }
}

/**
 * Import prompts from JSON data
 * @param {Object|Array} importData - The data to import
 * @returns {Promise<Object>} Result with success status and count
 */
export async function importPrompts(importData) {
  try {
    const prompts = importData.prompts || importData;
    let imported = 0;
    
    for (const prompt of prompts) {
      // Remove ID to avoid conflicts
      const { id, ...promptData } = prompt;
      await db.prompts.add(promptData);
      imported++;
    }
    
    return { success: true, imported };
  } catch (error) {
    console.error('Error importing prompts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle favorite status for a prompt
 * @param {number} promptId - The ID of the prompt
 * @returns {Promise<Object>} Result with success status
 */
export async function toggleFavorite(promptId) {
  try {
    const prompt = await db.prompts.get(promptId);
    if (prompt) {
      await db.prompts.update(promptId, { isFavorite: !prompt.isFavorite });
      return { success: true, isFavorite: !prompt.isFavorite };
    }
    return { success: false, error: 'Prompt not found' };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get favorite prompts
 * @returns {Promise<Array>} Array of favorite prompts
 */
export async function getFavoritePrompts() {
  try {
    const prompts = await db.prompts
      .where('isFavorite')
      .equals(true)
      .reverse()
      .sortBy('timestamp');
    return prompts;
  } catch (error) {
    console.error('Error fetching favorite prompts:', error);
    return [];
  }
}

/**
 * Save a setting
 * @param {string} key - The setting key
 * @param {any} value - The setting value
 * @returns {Promise<boolean>} Success status
 */
export async function saveSetting(key, value) {
  try {
    await db.settings.put({ key, value });
    return true;
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    return false;
  }
}

/**
 * Get a setting
 * @param {string} key - The setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {Promise<any>} The setting value
 */
export async function getSetting(key, defaultValue = null) {
  try {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Get API key (compatibility with previous version)
 * @returns {Promise<string>} The API key
 */
export async function getApiKey() {
  return getSetting(API_KEY_SETTING, '');
}

/**
 * Save API key (compatibility with previous version)
 * @param {string} key - The API key
 * @returns {Promise<boolean>} Success status
 */
export async function saveApiKey(key) {
  return saveSetting(API_KEY_SETTING, key);
}

/**
 * Get storage statistics
 * @returns {Promise<Object>} Storage statistics
 */
export async function getStorageStats() {
  try {
    const promptCount = await db.prompts.count();
    const favoriteCount = await db.prompts.where('isFavorite').equals(true).count();
    const categories = await db.prompts.orderBy('category').uniqueKeys();
    
    return {
      success: true,
      stats: {
        totalPrompts: promptCount,
        favoritePrompts: favoriteCount,
        categories: categories.length,
        categoryList: categories
      }
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all data
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllData() {
  try {
    await db.prompts.clear();
    await db.settings.clear();
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

/**
 * Save the selected model
 * @param {string} modelId - The selected model ID
 * @returns {Promise<void>}
 */
export async function saveSelectedModel(modelId) {
  try {
    await saveSetting(SELECTED_MODEL_SETTING, modelId);
  } catch (error) {
    console.error('Error saving selected model:', error);
  }
}

/**
 * Get the currently selected model
 * @returns {Promise<string|null>} The selected model ID or null
 */
export async function getSelectedModel() {
  try {
    return await getSetting(SELECTED_MODEL_SETTING);
  } catch (error) {
    console.error('Error getting selected model:', error);
    return null;
  }
}

/**
 * Cache available models from OpenRouter
 * @param {Array} models - Array of model objects
 * @returns {Promise<void>}
 */
export async function cacheModels(models) {
  try {
    await saveSetting(MODELS_CACHE_SETTING, JSON.stringify(models));
    await saveSetting(MODELS_CACHE_TIMESTAMP, Date.now());
  } catch (error) {
    console.error('Error caching models:', error);
  }
}

/**
 * Get cached models from storage
 * @returns {Promise<Array|null>} Array of model objects or null
 */
export async function getCachedModels() {
  try {
    const modelsJson = await getSetting(MODELS_CACHE_SETTING);
    const timestamp = await getSetting(MODELS_CACHE_TIMESTAMP);
    
    // Check if cache is older than 24 hours
    const cacheExpired = !timestamp || (Date.now() - timestamp > 24 * 60 * 60 * 1000);
    
    if (!modelsJson || cacheExpired) {
      return null;
    }
    
    return JSON.parse(modelsJson);
  } catch (error) {
    console.error('Error getting cached models:', error);
    return null;
  }
}

// Provide backwards compatibility with the localStorage API
export default {
  getSavedPrompts,
  savePrompt,
  deletePrompt,
  searchPrompts,
  exportPrompts,
  importPrompts,
  toggleFavorite,
  getFavoritePrompts,
  saveSetting,
  getSetting,
  getApiKey,
  saveApiKey,
  getStorageStats,
  clearAllData,
  saveSelectedModel,
  getSelectedModel,
  cacheModels,
  getCachedModels
};
