export type PlatformType = "gmail" | "whatsapp";

export interface Participant {
  displayName?: string;
  identifier?: string;
  type?: "contact" | "user" | "unknown";
}

export interface ConversationMessage {
  id: string;
  sender?: Participant;
  timestamp?: string;
  text: string;
  direction: "incoming" | "outgoing" | "unknown";
  isQuoted?: boolean;
  isSystemMessage?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ConversationContext {
  platform: PlatformType;
  conversationId?: string;
  title?: string;
  participants: Participant[];
  messages: ConversationMessage[];
  latestMessage?: ConversationMessage;
  visibleMessageCount?: number;
  analyzedMessageCount?: number;
  completeness: "unknown" | "partial" | "available-context";
  summary?: string;
  detectedLanguage?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatIdentity {
  key: string;
  title?: string;
  participantHint?: string;
  source: "header" | "url" | "dom" | "fallback";
  confidence: number;
}

export interface ComposerHandle {
  id: string;
  element: HTMLElement | null;
  platform: PlatformType;
  hasExistingText: boolean;
  getText: () => string;
}

export type InsertMode = "replace" | "append" | "insert-below";

export interface ConversationDetection {
  active: boolean;
  identity?: ChatIdentity;
  error?: string;
}

export interface ConversationPlatform {
  readonly type: PlatformType;
  isSupported(): boolean;
  detectActiveConversation(): Promise<ConversationDetection>;
  getConversation(): Promise<ConversationContext>;
  getActiveComposer(): Promise<ComposerHandle | null>;
  insertReply(
    composer: ComposerHandle,
    text: string,
    mode?: InsertMode
  ): Promise<void>;
}

export interface ReplyInstructions {
  tone: string;
  length: string;
  instruction: string;
  objective?: string;
}

export type PlatformMessage =
  | {
      type: "WHATSAPP_DETECT_CHAT";
    }
  | {
      type: "WHATSAPP_GET_CONTEXT";
      payload: {
        conversationKey: string;
      };
    }
  | {
      type: "GENERATE_REPLY";
      payload: {
        platform: PlatformType;
        conversation?: ConversationContext; // For WhatsApp, we pass raw context.
        threadId?: string;                  // For Gmail, we pass threadId
        subject?: string;                   // For Gmail, we pass subject
        instructions: ReplyInstructions;
      };
    };
