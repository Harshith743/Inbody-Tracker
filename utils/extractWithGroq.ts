import * as FileSystem from 'expo-file-system/legacy';
import { InBodyReport } from '../types/report';

/**
 * Extracts InBody report data using Groq's Vision LLM.
 * This is more resilient than local zonal OCR as the LLM understands
 * the report structure regardless of slight framing or rotation errors.
 */
export async function extractWithGroq(
  imageUri: string
): Promise<Partial<InBodyReport>> {

  try {
    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    const mediaType = imageUri.toLowerCase().endsWith('.png') 
      ? 'image/png' 
      : 'image/jpeg';

    const dataUrl = `data:${mediaType};base64,${base64}`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY ?? ''}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
                {
                  type: 'text',
                  text: `This is an InBody body composition report.
Extract ALL visible fields and return ONLY a raw JSON object.
No explanation, no markdown, no code blocks. Just the JSON.

{
  "date": "YYYY-MM-DD",
  "inbodyScore": number,
  "weight": number,
  "totalBodyWater": number,
  "protein": number,
  "mineral": number,
  "bodyFatMass": number,
  "skeletalMuscleMass": number,
  "bmi": number,
  "percentBodyFat": number,
  "fatFreeMass": number,
  "basalMetabolicRate": number,
  "obesityDegree": number,
  "visceralFatLevel": number,
  "waistHipRatio": number,
  "segLeanLeftArm": number,
  "segLeanLeftArmPct": number,
  "segLeanRightArm": number,
  "segLeanRightArmPct": number,
  "segLeanTrunk": number,
  "segLeanTrunkPct": number,
  "segLeanLeftLeg": number,
  "segLeanLeftLegPct": number,
  "segLeanRightLeg": number,
  "segLeanRightLegPct": number,
  "segFatLeftArm": number,
  "segFatLeftArmPct": number,
  "segFatRightArm": number,
  "segFatRightArmPct": number,
  "segFatTrunk": number,
  "segFatTrunkPct": number,
  "segFatLeftLeg": number,
  "segFatLeftLegPct": number,
  "segFatRightLeg": number,
  "segFatRightLegPct": number
}

Omit any field you cannot read clearly. Return only the JSON.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message ?? 'Groq API error');
    }

    const text = data.choices?.[0]?.message?.content ?? '{}';

    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return parsed as Partial<InBodyReport>;
  } catch (e) {
    throw e;
  }
}
