import { get, set } from 'idb-keyval';

const QUEUE_KEY = 'offline-action-queue';
const TICKETS_KEY = 'cached-tickets';

/**
 * Append an action object to the offline action queue
 * @param {Object} action - Action details { type, endpoint, method, body }
 */
export async function queueOfflineAction(action) {
  try {
    const queue = (await get(QUEUE_KEY)) || [];
    const newAction = {
      ...action,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
    };
    queue.push(newAction);
    await set(QUEUE_KEY, queue);
    console.log('Action queued offline:', newAction);
    return newAction;
  } catch (err) {
    console.error('Failed to queue offline action:', err);
  }
}

/**
 * Retrieve the current offline action queue
 * @returns {Promise<Array>}
 */
export async function getOfflineQueue() {
  try {
    return (await get(QUEUE_KEY)) || [];
  } catch (err) {
    console.error('Failed to get offline queue:', err);
    return [];
  }
}

/**
 * Remove a specific action from the queue by its ID
 * @param {string} actionId
 */
export async function removeFromQueue(actionId) {
  try {
    const queue = (await get(QUEUE_KEY)) || [];
    const filtered = queue.filter(item => item.id !== actionId);
    await set(QUEUE_KEY, filtered);
  } catch (err) {
    console.error('Failed to remove action from queue:', err);
  }
}

/**
 * Clear the offline action queue completely
 */
export async function clearOfflineQueue() {
  try {
    await set(QUEUE_KEY, []);
  } catch (err) {
    console.error('Failed to clear offline queue:', err);
  }
}

/**
 * Cache an array of tickets for offline viewing
 * @param {Array} tickets
 */
export async function cacheTickets(tickets) {
  try {
    await set(TICKETS_KEY, tickets || []);
    console.log('Successfully cached tickets offline');
  } catch (err) {
    console.error('Failed to cache tickets:', err);
  }
}

/**
 * Retrieve cached tickets
 * @returns {Promise<Array>}
 */
export async function getCachedTickets() {
  try {
    return (await get(TICKETS_KEY)) || [];
  } catch (err) {
    console.error('Failed to get cached tickets:', err);
    return [];
  }
}
