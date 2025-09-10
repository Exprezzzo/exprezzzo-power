import { db } from '../config/firebase';

export class IntegrationService {
  static async logActivity(userId: string, activity: any) {
    try {
      await db.collection('activities').add({
        userId,
        ...activity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
  
  static async getIntegrationStatus(userId: string) {
    try {
      const doc = await db
        .collection('integrations')
        .doc(userId)
        .get();
      
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Failed to get integration status:', error);
      return null;
    }
  }
}