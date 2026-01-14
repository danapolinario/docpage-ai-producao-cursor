import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'landing-pages';

/**
 * Upload de foto para o Supabase Storage
 */
export async function uploadPhoto(
  file: File,
  landingPageId: string,
  type: 'profile' | 'about'
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Validar tipo de arquivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo inválido. Use JPG, PNG ou WebP');
  }

  // Validar tamanho (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Máximo 5MB');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${landingPageId}/${type}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload de foto a partir de base64 (para fotos geradas pela IA)
 */
export async function uploadPhotoFromBase64(
  base64Data: string,
  landingPageId: string,
  type: 'profile' | 'about'
): Promise<string> {
  // Converter base64 para blob
  const response = await fetch(base64Data);
  const blob = await response.blob();
  
  // Criar arquivo a partir do blob
  const file = new File([blob], `${type}.jpg`, { type: 'image/jpeg' });
  
  return uploadPhoto(file, landingPageId, type);
}

/**
 * Deletar foto do storage
 */
export async function deletePhoto(fileUrl: string): Promise<void> {
  // Extrair caminho da URL
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
    
    if (bucketIndex === -1) {
      throw new Error('URL inválida');
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
  } catch (error: any) {
    throw new Error(`Erro ao deletar foto: ${error.message}`);
  }
}

/**
 * Listar todas as fotos de uma landing page
 */
export async function listPhotos(landingPageId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(landingPageId);

  if (error) throw error;
  
  return (data || []).map(file => {
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${landingPageId}/${file.name}`);
    return publicUrl;
  });
}
