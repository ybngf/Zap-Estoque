/**
 * Image Service - Busca imagens adequadas para produtos usando IA
 */

interface ImageSearchResult {
  url: string;
  thumbnail: string;
  description: string;
  source: string;
}

/**
 * Busca uma imagem adequada para um produto usando Unsplash API
 */
export const searchProductImage = async (productName: string): Promise<string | null> => {
  try {
    // Remove caracteres especiais e limpa o nome
    const cleanName = productName
      .replace(/REF\./gi, '')
      .replace(/\d+ML/gi, '')
      .replace(/\d+L/gi, '')
      .replace(/\d+G/gi, '')
      .replace(/\d+KG/gi, '')
      .replace(/PACOTE/gi, '')
      .replace(/UNIDADE/gi, '')
      .replace(/UN\./gi, '')
      .trim();

    // Unsplash Access Key (você pode usar uma chave pública)
    // Para produção, mover para variável de ambiente
    const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY_HERE';
    
    // Se não tiver key, usar Pixabay como alternativa (não requer autenticação para uso básico)
    const usePixabay = !UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY_HERE';

    if (usePixabay) {
      return await searchPixabayImage(cleanName);
    }

    // Buscar no Unsplash
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanName)}&per_page=1&orientation=squarish`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error('Erro ao buscar imagem no Unsplash:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Retorna a URL da imagem em tamanho regular
      return data.results[0].urls.regular;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    return null;
  }
};

/**
 * Busca imagem no Pixabay (alternativa gratuita)
 */
const searchPixabayImage = async (productName: string): Promise<string | null> => {
  try {
    // Pixabay API Key (gratuita - https://pixabay.com/api/docs/)
    const PIXABAY_API_KEY = '46737899-b38ce8e1a26a3f4110dae3156';
    
    const response = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(productName)}&image_type=photo&per_page=3&safesearch=true`
    );

    if (!response.ok) {
      console.error('Erro ao buscar imagem no Pixabay:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.hits && data.hits.length > 0) {
      // Retorna a URL da imagem em tamanho médio (webformatURL)
      return data.hits[0].webformatURL;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar imagem no Pixabay:', error);
    return null;
  }
};

/**
 * Busca imagens usando Google Custom Search (requer API key)
 */
export const searchGoogleImage = async (productName: string): Promise<string | null> => {
  try {
    const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
    const GOOGLE_CX = 'YOUR_SEARCH_ENGINE_ID';

    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY') {
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(productName)}&cx=${GOOGLE_CX}&searchType=image&key=${GOOGLE_API_KEY}&num=1`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar imagem no Google:', error);
    return null;
  }
};

/**
 * Valida se uma URL de imagem é acessível
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
};
