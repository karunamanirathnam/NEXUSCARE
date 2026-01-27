
import { GoogleGenAI, Type } from "@google/genai";
import { MediaAnalysis, MediaType, MediaItem } from "../types";

// Fix: Strictly use process.env.API_KEY for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMedia = async (
  base64Data: string,
  mimeType: string,
  type: MediaType
): Promise<MediaAnalysis> => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstructions = `
    You are an AI processing engine mimicking AWS Rekognition, Transcribe, and Comprehend.
    - For images: Act as Rekognition. Detect labels, objects, text, and moderation flags.
    - For audio: Act as Transcribe & Comprehend. Transcribe accurately, extract keywords, and determine sentiment.
    - For video: Analyze the provided frame and provide visual context as Rekognition.
    
    Return the response strictly as a JSON object matching the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this media file for the dashboard. Provide detailed metadata as requested." }
        ]
      },
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: "application/json",
        // Add responseSchema to ensure reliable JSON structure
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            labels: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Detected labels and objects in the media."
            },
            transcript: {
              type: Type.STRING,
              description: "Transcription of audio content if applicable."
            },
            sentiment: {
              type: Type.STRING,
              description: "Detected sentiment (e.g., Positive, Negative, Neutral)."
            },
            summary: {
              type: Type.STRING,
              description: "A brief summary of the media content."
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key topics or themes extracted from the content."
            },
            moderationFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Any content moderation warnings."
            }
          },
          required: ["labels", "summary"]
        }
      }
    });

    // Use .text property directly as per latest SDK guidelines
    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const chatWithMedia = async (
  item: MediaItem,
  userMessage: string
): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  const context = `
    You are the AI assistant for a specific video/media item in SnapStream.
    Item Name: ${item.name}
    Summary: ${item.analysis?.summary || 'N/A'}
    Transcript: ${item.analysis?.transcript || 'N/A'}
    Labels: ${item.analysis?.labels?.join(', ') || 'N/A'}
    
    Answer the user's question about this media concisely and helpfully.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userMessage,
      config: {
        systemInstruction: context
      }
    });
    // Use .text property directly as per latest SDK guidelines
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (err) {
    return "The neural link is currently unstable. Please try again.";
  }
};
