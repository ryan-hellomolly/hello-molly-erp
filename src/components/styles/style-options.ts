export type StyleFormOptions = {
  customers: { id: string; code: string; name: string }[];
  units: { id: string; nameEn: string; nameZh: string; symbol: string | null }[];
  constructionTemplates: { id: string; code: string; nameEn: string; nameZh: string }[];
  measurementTemplates: { id: string; code: string; nameEn: string; nameZh: string }[];
  styleTypes: { id: string; nameEn: string; nameZh: string; depth: number }[];
  seasons: { id: string; nameEn: string; nameZh: string }[];
  years: { id: string; nameEn: string; nameZh: string }[];
  stages: { id: string; nameEn: string; nameZh: string }[];
};
