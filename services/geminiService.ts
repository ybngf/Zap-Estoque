
import { GoogleGenAI, Type } from "@google/genai";
import * as api from './api';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

// Get API key with priority: Company Settings > System Settings > Environment Variable
const getApiKey = async (): Promise<string> => {
  // Priority 1: Try company settings first
  try {
    const companySettings = await api.getCompanySettings();
    const companyApiKey = companySettings.gemini_api_key?.value;
    
    if (companyApiKey && companyApiKey.trim() !== '') {
      console.log('✅ Using API key from company settings');
      return companyApiKey;
    }
    
    console.log('⚠️ API key not found in company settings, trying system settings');
  } catch (error) {
    console.warn('⚠️ Could not fetch company settings:', error);
  }
  
  // Priority 2: Try system settings
  try {
    const settings = await api.getSettings();
    const apiKey = settings.gemini_api_key?.value;
    
    if (apiKey && apiKey.trim() !== '') {
      console.log('✅ Using API key from system settings');
      return apiKey;
    }
    
    console.log('⚠️ API key not found in system settings, trying environment variable');
  } catch (error) {
    console.warn('⚠️ Could not fetch system settings:', error);
  }
  
  // Priority 3: Fallback to environment variable
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) {
    console.log('✅ Using API key from environment variable');
    return envKey;
  }
  
  throw new Error("❌ API Key do Gemini não configurada. Configure nas Configurações da Empresa ou nas Configurações do Sistema, ou adicione VITE_GEMINI_API_KEY no arquivo .env");
};

export const parseInvoiceWithGemini = async (imageFile: File) => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `
    Analyze the provided invoice image. Extract all line items, including product name, quantity, unit price, and suggest an appropriate category.
    
    Return the data as a JSON object. The root should be an object with a single key "items", which is an array of objects. 
    Each object in the array should have five keys:
    - "productName" (string): Name of the product
    - "quantity" (number): Quantity purchased
    - "unitPrice" (number): Unit price
    - "imageUrl" (string): A URL for an appropriate product image using the format: https://source.unsplash.com/400x400/?{product-keywords}
      where {product-keywords} should be relevant English keywords separated by commas (e.g., "apple,fruit" for apple, "milk,dairy" for milk)
    - "suggestedCategory" (string): An appropriate category name in Portuguese for this product. Common categories include:
      * Alimentos e Bebidas (for food and drinks)
      * Limpeza (for cleaning products)
      * Higiene Pessoal (for personal hygiene)
      * Papelaria (for stationery)
      * Eletrônicos (for electronics)
      * Móveis e Decoração (for furniture and decoration)
      * Roupas e Acessórios (for clothing and accessories)
      * Ferramentas (for tools)
      * Automotivo (for automotive)
      * Outros (for other products)
    
    For imageUrl, use English keywords that best describe the product visually. Examples:
    - "Arroz" → https://source.unsplash.com/400x400/?rice,grain
    - "Leite" → https://source.unsplash.com/400x400/?milk,dairy
    - "Maçã" → https://source.unsplash.com/400x400/?apple,fruit
    - "Sabão em Pó" → https://source.unsplash.com/400x400/?detergent,powder
    
    If you cannot find any items, return an empty array.
    Do not include any text outside of the JSON object in your response.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  imageUrl: { type: Type.STRING },
                  suggestedCategory: { type: Type.STRING },
                },
                required: ["productName", "quantity", "unitPrice", "imageUrl", "suggestedCategory"],
              },
            },
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.items || [];
    
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to parse invoice. The AI model could not process the request.");
  }
};
