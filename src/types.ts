export interface Feature {
  id: number;
  number: number;
  name: string;
  description?: string;
  steps: Step[];
  comments: Comment[];
  verifications: Verification[];
}

export interface Step {
  id: number;
  number: number;
  description: string;
  order: number;
  status: VerificationStatus;
  lastVerified?: number;
  media?: StepMedia[];
}

export interface StepMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  createdAt: string;
}

export interface Comment {
  id: number;
  text: string;
  author: string;
  timestamp: number;
}

export interface Team {
  id: number;
  name: string;
  order: number;
  features: Feature[];
  isPinned?: boolean;
}

export interface Verification {
  id: number;
  timestamp: number;
  steps: {
    stepId: number;
    status: VerificationStatus;
  }[];
}

export interface GlobalVerification {
  id: string;
  timestamp: number;
  teamId: number;
  teamName: string;
  featureId: number;
  featureNumber: number;
  featureName: string;
  steps: {
    id: number;
    number: number;
    description: string;
    status: VerificationStatus;
  }[];
  comments: Comment[];
}

export interface NoteFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  files?: NoteFile[];
  updated_at: string;
  created_at: string;
}

export type VerificationStatus = 'working' | 'not_working' | 'pending';