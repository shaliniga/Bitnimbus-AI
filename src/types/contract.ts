export interface ContractParty {
  role: string;
  name: string;
}

export interface ContractParagraph {
  id: string;
  number: string | null;
  text: string;
}

export interface ContractSection {
  id: string;
  number: string | null;
  heading: string;
  paragraphs: ContractParagraph[];
}

export interface ContractDocument {
  id: string;
  title: string;
  effectiveDate: string;
  parties: ContractParty[];
  sections: ContractSection[];
}
