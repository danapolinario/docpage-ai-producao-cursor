import React from 'react';
import { LandingPageContent, DesignSettings, SectionVisibility, BriefingData, LayoutVariant } from '../types';
import { ClassicSplit } from './layouts/ClassicSplit';
import { ModernCentered } from './layouts/ModernCentered';
import { ImmersiveOverlay } from './layouts/ImmersiveOverlay';
import { GridStudio } from './layouts/GridStudio';
import { Editorial } from './layouts/Editorial';

interface Props {
  content: LandingPageContent;
  design: DesignSettings;
  visibility: SectionVisibility;
  photoUrl: string | null;
  aboutPhotoUrl: string | null; // Added prop
  briefing: BriefingData;
  layoutVariant: LayoutVariant;
  landingPageId?: string;
  isPreview?: boolean;
  isEditorMode?: boolean; // NOVO: Flag para indicar se está no modo editor
  hasCustomTestimonials?: boolean; // NOVO: Flag para indicar se depoimentos são customizados
}

export const Preview: React.FC<Props> = (props) => {
  const { layoutVariant, content, isEditorMode, hasCustomTestimonials, visibility } = props;

  // Verificação de segurança: se não houver conteúdo, mostrar mensagem
  if (!content) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Aguardando conteúdo...</p>
          <p className="text-sm text-gray-400 mt-2">Gere o conteúdo da landing page primeiro</p>
        </div>
      </div>
    );
  }

  // Renderizar preview - aviso agora está dentro da seção de depoimentos
  switch (layoutVariant) {
    case 2:
      return <ModernCentered {...props} isEditorMode={isEditorMode} hasCustomTestimonials={hasCustomTestimonials} />;
    case 3:
      return <ImmersiveOverlay {...props} isEditorMode={isEditorMode} hasCustomTestimonials={hasCustomTestimonials} />;
    case 4:
      return <GridStudio {...props} isEditorMode={isEditorMode} hasCustomTestimonials={hasCustomTestimonials} />;
    case 5:
      return <Editorial {...props} isEditorMode={isEditorMode} hasCustomTestimonials={hasCustomTestimonials} />;
    case 1:
    default:
      return <ClassicSplit {...props} isEditorMode={isEditorMode} hasCustomTestimonials={hasCustomTestimonials} />;
  }
};