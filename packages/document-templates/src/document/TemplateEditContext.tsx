import React, { createContext, useContext } from "react";

export interface TemplateEditContextType {
  isEditing?: boolean;
  onFieldChange?: (key: string, value: any) => void;
  personelListesi?: any[];
  firmaListesi?: any[];
  birimListesi?: any[];
  firstPageLimit?: number | null;
  data?: Record<string, any>;
}

export const TemplateEditContext = createContext<TemplateEditContextType>({
  isEditing: false,
});

export const useTemplateEdit = () => useContext(TemplateEditContext);

export interface TemplateEditProviderProps extends TemplateEditContextType {
  children?: React.ReactNode;
}

export function TemplateEditProvider({
  children,
  isEditing = false,
  onFieldChange,
  personelListesi,
  firmaListesi,
  birimListesi,
  firstPageLimit,
  data,
}: TemplateEditProviderProps) {
  return (
    <TemplateEditContext.Provider
      value={{
        isEditing,
        onFieldChange,
        personelListesi,
        firmaListesi,
        birimListesi,
        firstPageLimit,
        data,
      }}
    >
      {children}
    </TemplateEditContext.Provider>
  );
}


