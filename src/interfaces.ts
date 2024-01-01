export interface Definition {
  definition: string;
  example: string;
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

export interface WordDefinition {
  meanings: Meaning[];
}

export type DictionaryEntry = WordDefinition[];

export interface NumberToWordDTO {
  num: number;
}
