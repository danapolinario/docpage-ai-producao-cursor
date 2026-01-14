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
}

export const Preview: React.FC<Props> = (props) => {
  const { layoutVariant, content } = props;

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

  switch (layoutVariant) {
    case 2:
      return <ModernCentered {...props} />;
    case 3:
      return <ImmersiveOverlay {...props} />;
    case 4:
      return <GridStudio {...props} />;
    case 5:
      return <Editorial {...props} />;
    case 1:
    default:
      return <ClassicSplit {...props} />;
  }
};