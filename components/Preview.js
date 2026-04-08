import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ClassicSplit } from './layouts/ClassicSplit';
import { ModernCentered } from './layouts/ModernCentered';
import { ImmersiveOverlay } from './layouts/ImmersiveOverlay';
import { GridStudio } from './layouts/GridStudio';
import { Editorial } from './layouts/Editorial';
export const Preview = (props) => {
    const { layoutVariant, content, isEditorMode, hasCustomTestimonials, visibility } = props;
    // Verificação de segurança: se não houver conteúdo, mostrar mensagem
    if (!content) {
        return (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center p-8", children: [_jsx("div", { className: "w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 font-medium", children: "Aguardando conte\u00FAdo..." }), _jsx("p", { className: "text-sm text-gray-400 mt-2", children: "Gere o conte\u00FAdo do seu site" })] }) }));
    }
    // Renderizar preview - aviso agora está dentro da seção de depoimentos
    switch (layoutVariant) {
        case 2:
            return _jsx(ModernCentered, { ...props, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials });
        case 3:
            return _jsx(ImmersiveOverlay, { ...props, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials });
        case 4:
            return _jsx(GridStudio, { ...props, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials });
        case 5:
            return _jsx(Editorial, { ...props, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials });
        case 1:
        default:
            return _jsx(ClassicSplit, { ...props, isEditorMode: isEditorMode, hasCustomTestimonials: hasCustomTestimonials });
    }
};
