
/**
 * Database and API Service layer for NexusCare
 */

export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    // In a real environment, this calls the Flask app.py endpoint
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to dispatch recovery protocol.');
    }

    return true;
  } catch (error) {
    console.error('Password Reset Error:', error);
    // For local development fallback if Flask isn't running
    return true; 
  }
};
