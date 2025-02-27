import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Position {
  x: number;
  y: number;
}

interface Node {
  id: string;
  question: string;
  answer: string;
  position: Position;
  connections: string[];
}

interface StringConnection {
  id: string;
  points: Position[];
  connectedNodes: string[];
}

interface ExplorationData {
  id: string;
  userId: string;
  title: string;
  nodes: Record<string, Node>;
  strings: Record<string, StringConnection>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface UserPreferences {
  id: string;
  userId: string;
  colors: Record<string, string>;
  lastActiveExploration: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firestore service for handling database operations
 */
export const firestoreService = {
  // Exploration Sessions
  
  async saveExplorationSession(
    userId: string, 
    data: Partial<ExplorationData>
  ): Promise<string> {
    try {
      const sessionsRef = collection(db, 'explorationSessions');
      const docRef = await addDoc(sessionsRef, {
        userId,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving exploration session:', error);
      throw error;
    }
  },

  async getUserSessions(userId: string): Promise<ExplorationData[]> {
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
      })) as ExplorationData[];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  },

  async getExplorationSession(sessionId: string): Promise<ExplorationData | null> {
    try {
      const docRef = doc(db, 'explorationSessions', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as ExplorationData;
      }
      return null;
    } catch (error) {
      console.error('Error getting exploration session:', error);
      throw error;
    }
  },

  async updateExplorationSession(
    sessionId: string, 
    data: Partial<ExplorationData>
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

  async deleteExplorationSession(sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, 'explorationSessions', sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting exploration session:', error);
      throw error;
    }
  },

  // User Preferences

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const docRef = doc(db, 'userPreferences', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as UserPreferences;
      }

      // Initialize user preferences if they don't exist
      const initialPreferences: Omit<UserPreferences, 'id'> = {
        userId,
        colors: {},
        lastActiveExploration: '',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, initialPreferences);
      
      return {
        id: userId,
        ...initialPreferences
      } as UserPreferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  },

  async updateUserPreferences(
    userId: string, 
    data: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'userPreferences', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(docRef, {
          userId,
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  // String Connections

  async updateStringConnections(
    sessionId: string,
    strings: Record<string, StringConnection>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'explorationSessions', sessionId);
      await updateDoc(docRef, {
        strings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating string connections:', error);
      throw error;
    }
  },

  // Node Positions

  async updateNodePositions(
    sessionId: string,
    nodeId: string,
    position: Position
  ): Promise<void> {
    try {
      const docRef = doc(db, 'explorationSessions', sessionId);
      await updateDoc(docRef, {
        [`nodes.${nodeId}.position`]: position,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating node position:', error);
      throw error;
    }
  },

  // Color Preferences

  async updateColorPreferences(
    userId: string,
    colors: Record<string, string>
  ): Promise<void> {
    try {
      await this.updateUserPreferences(userId, { colors });
    } catch (error) {
      console.error('Error updating color preferences:', error);
      throw error;
    }
  }
}; 