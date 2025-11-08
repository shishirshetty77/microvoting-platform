export interface VoteResults {
  [key: string]: number;
}

export interface VoteResponse {
  message: string;
}

export interface Candidate {
  id: string;
  name: string;
  description: string;
  color: {
    from: string;
    to: string;
    text: string;
  };
}

export interface ToastMessage {
  type: 'success' | 'error';
  text: string;
}
