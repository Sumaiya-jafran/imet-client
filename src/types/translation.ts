export type Language = 'en' | 'bn' | 'zh';
export type TranslationResourceType =
  'MACHINERY' | 'SPECIFICATION' | 'SUPPLIER' | 'REVIEW';
export interface TranslationReference {
  type: TranslationResourceType;
  id: string;
  field: 'NAME' | 'DESCRIPTION' | 'LABEL' | 'BODY';
}
export interface TranslationResult {
  resource: TranslationReference;
  sourceText: string;
  sourceLanguage: Language | null;
  targetLanguage: Language;
  text: string | null;
  status: 'MISSING' | 'STALE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}
export interface TranslationField {
  resource: TranslationReference;
  original: string;
  sourceHash: string;
  translations: TranslationResult[];
}
export interface TranslationDetail {
  fields: TranslationField[];
  providerConfigured: boolean;
  maxCharacters: number;
}
export interface TranslationResources {
  resources: {
    type: Exclude<TranslationResourceType, 'SPECIFICATION'>;
    id: string;
    title: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  providerConfigured: boolean;
  maxCharacters: number;
}
export const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'zh', label: '中文' },
];
