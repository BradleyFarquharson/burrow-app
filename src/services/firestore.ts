import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Node } from '@/types';

/**
 * Firestore service for handling database operations
 */
export const firestoreService = {
  /**
   * Save exploration session to Firestore
   * 
   * @param userId - User ID to associate with the session
   * @param nodes - Map of nodes in the exploration session
   * @param title - Optional title for the session
   * @returns The ID of the created session
   */
  async saveExplorationSession(
    userId: string, 
    nodes: Record<string, Node>, 
    title?: string
  ): Promise<string> {
    try {
      const sessionsRef = collection(db, 'explorationSessions');
      const docRef = await addDoc(sessionsRef, {
        userId,
        title: title || 'Untitled Exploration',
        nodes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving exploration session:', error);
      throw error;
    }
  },
  
  /**
   * Get all exploration sessions for a user
   * 
   * @param userId - User ID to get sessions for
   * @returns Array of exploration sessions
   */
  async getUserSessions(userId: string): Promise<DocumentData[]> {
    try {
      const sessionsRef = collection(db, 'explorationSessions');
      const q = query(
        sessionsRef, 
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific exploration session
   * 
   * @param sessionId - ID of the session to retrieve
   * @returns The session data or null if not found
   */
  async getExplorationSession(sessionId: string): Promise<DocumentData | null> {
    try {
      const docRef = doc(db, 'explorationSessions', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting exploration session:', error);
      throw error;
    }
  },
  
  /**
   * Update an exploration session
   * 
   * @param sessionId - ID of the session to update
   * @param data - Data to update
   */
  async updateExplorationSession(
    sessionId: string, 
    data: Partial<{ title: string; nodes: Record<string, Node> }>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'explorationSessions', sessionId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating exploration session:', error);
      throw error;
    }
  },
  
  /**
   * Delete an exploration session
   * 
   * @param sessionId - ID of the session to delete
   */
  async deleteExplorationSession(sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, 'explorationSessions', sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting exploration session:', error);
      throw error;
    }
  }
}; 