import { supabase } from '../lib/supabase';

const SUPABASE_URL = "https://vflyfaqsapfpmxldqenj.supabase.co";

/**
 * Converter base64 para File
 */
function base64ToFile(base64: string, filename: string): File {
  // Remove prefix if present (data:image/png;base64,)
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const mimeMatch = base64.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: mimeType });
}

/**
 * Verificar se é uma URL base64
 */
function isBase64(str: string): boolean {
  return str.startsWith('data:');
}

/**
 * Upload de foto para o storage
 * @param photoData - URL da foto (base64 ou URL externa)
 * @param userId - ID do usuário
 * @param filename - Nome do arquivo (ex: 'profile.png', 'about.png')
 * @returns URL pública da foto no storage
 */
export async function uploadPhoto(
  photoData: string,
  userId: string,
  filename: string
): Promise<string> {
  // Se já for uma URL do Supabase Storage, retornar como está
  if (photoData.includes('supabase.co/storage')) {
    return photoData;
  }

  let file: File;
  
  if (isBase64(photoData)) {
    // Converter base64 para File
    file = base64ToFile(photoData, filename);
  } else {
    // É uma URL externa - fazer download e re-upload
    try {
      const response = await fetch(photoData);
      const blob = await response.blob();
      file = new File([blob], filename, { type: blob.type || 'image/png' });
    } catch (error) {
      console.error('Error downloading external image:', error);
      // Se falhar o download, retornar a URL original
      return photoData;
    }
  }

  // Path: user_id/filename (para respeitar RLS)
  const path = `${userId}/${filename}`;

  // Upload para o storage
  const { data, error } = await supabase.storage
    .from('landing-pages')
    .upload(path, file, {
      upsert: true, // Substituir se já existir
      contentType: file.type,
    });

  if (error) {
    console.error('Error uploading photo:', error);
    throw new Error(`Erro ao fazer upload da foto: ${error.message}`);
  }

  // Retornar URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('landing-pages')
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Upload de múltiplas fotos
 */
export async function uploadPhotos(
  userId: string,
  photos: { profilePhoto?: string | null; aboutPhoto?: string | null }
): Promise<{ profilePhotoUrl: string | null; aboutPhotoUrl: string | null }> {
  const result: { profilePhotoUrl: string | null; aboutPhotoUrl: string | null } = {
    profilePhotoUrl: null,
    aboutPhotoUrl: null,
  };

  const uploadPromises: Promise<void>[] = [];

  if (photos.profilePhoto) {
    uploadPromises.push(
      uploadPhoto(photos.profilePhoto, userId, 'profile.png')
        .then(url => { result.profilePhotoUrl = url; })
        .catch(err => {
          console.error('Failed to upload profile photo:', err);
          // Manter URL original se falhar
          result.profilePhotoUrl = photos.profilePhoto || null;
        })
    );
  }

  if (photos.aboutPhoto) {
    uploadPromises.push(
      uploadPhoto(photos.aboutPhoto, userId, 'about.png')
        .then(url => { result.aboutPhotoUrl = url; })
        .catch(err => {
          console.error('Failed to upload about photo:', err);
          // Manter URL original se falhar
          result.aboutPhotoUrl = photos.aboutPhoto || null;
        })
    );
  }

  await Promise.all(uploadPromises);

  return result;
}

/**
 * Deletar fotos de um usuário
 */
export async function deleteUserPhotos(userId: string): Promise<void> {
  const { error } = await supabase.storage
    .from('landing-pages')
    .remove([`${userId}/profile.png`, `${userId}/about.png`]);

  if (error) {
    console.error('Error deleting photos:', error);
  }
}
