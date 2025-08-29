import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  decimal,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums for WhatsApp tables
export const sessionStatusEnum = pgEnum('session_status', ['active', 'inactive', 'expired']);
export const sessionTypeEnum = pgEnum('session_type', ['guest', 'registered', 'premium']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'document', 'audio', 'video']);
export const processingStatusEnum = pgEnum('processing_status', ['pending', 'processing', 'completed', 'failed']);
export const mediaCategoryEnum = pgEnum('media_category', ['receipt', 'document', 'note', 'business_card', 'screenshot', 'whiteboard', 'other']);
export const templateCategoryEnum = pgEnum('template_category', ['utility', 'marketing', 'authentication']);
export const templateStatusEnum = pgEnum('template_status', ['pending', 'approved', 'rejected']);
export const messageTypeEnum = pgEnum('message_type', ['inbound', 'outbound']);
export const messageFormatEnum = pgEnum('message_format', ['text', 'image', 'audio', 'document', 'template', 'interactive']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['sent', 'delivered', 'read', 'failed']);

// WhatsApp Sessions table
export const whatsappSessions = pgTable('whatsapp_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text('phone_number').notNull().unique(),
  userId: uuid('user_id'), // References auth.users(id)
  sessionStatus: text('session_status').default('active'),
  sessionType: text('session_type').default('guest'),
  lastInteraction: timestamp('last_interaction', { withTimezone: true }).default(sql`NOW()`),
  context: jsonb('context').default({}),
  conversationState: text('conversation_state').default('idle'),
  pendingAction: jsonb('pending_action'),
  tempTaskCount: integer('temp_task_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  expiresAt: timestamp('expires_at', { withTimezone: true }).default(sql`NOW() + INTERVAL '7 days'`),
}, (table) => ({
  phoneIdx: index('idx_whatsapp_sessions_phone').on(table.phoneNumber),
  userIdx: index('idx_whatsapp_sessions_user').on(table.userId),
  expiresIdx: index('idx_whatsapp_sessions_expires').on(table.expiresAt),
}));

// WhatsApp Media table
export const whatsappMedia = pgTable('whatsapp_media', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'), // References auth.users(id)
  phoneNumber: text('phone_number').notNull(),
  mediaType: text('media_type').notNull(),
  mediaUrl: text('media_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  originalFilename: text('original_filename'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  
  // Extracted data
  extractedText: text('extracted_text'),
  extractedData: jsonb('extracted_data'),
  processingStatus: text('processing_status').default('pending'),
  processingError: text('processing_error'),
  
  // Task associations
  relatedTaskIds: uuid('related_task_ids').array().default(sql`'{}'`),
  
  // Categorization
  tags: text('tags').array().default(sql`'{}'`),
  category: text('category'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).default(sql`NOW() + INTERVAL '30 days'`),
}, (table) => ({
  userIdx: index('idx_whatsapp_media_user').on(table.userId),
  phoneIdx: index('idx_whatsapp_media_phone').on(table.phoneNumber),
  categoryIdx: index('idx_whatsapp_media_category').on(table.category),
  statusIdx: index('idx_whatsapp_media_status').on(table.processingStatus),
  createdIdx: index('idx_whatsapp_media_created').on(table.createdAt),
}));

// WhatsApp Templates table
export const whatsappTemplates = pgTable('whatsapp_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  templateName: text('template_name').notNull().unique(),
  templateId: text('template_id').notNull(),
  language: text('language').default('en'),
  category: text('category').notNull(),
  headerText: text('header_text'),
  bodyText: text('body_text').notNull(),
  footerText: text('footer_text'),
  variables: jsonb('variables').default([]),
  buttons: jsonb('buttons').default([]),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`NOW()`),
});

// WhatsApp Conversations table
export const whatsappConversations = pgTable('whatsapp_conversations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid('session_id').references(() => whatsappSessions.id, { onDelete: 'cascade' }),
  phoneNumber: text('phone_number').notNull(),
  messageType: text('message_type'),
  messageFormat: text('message_format'),
  messageContent: text('message_content'),
  mediaId: uuid('media_id').references(() => whatsappMedia.id),
  templateId: uuid('template_id').references(() => whatsappTemplates.id),
  
  // AI processing
  intent: text('intent'),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  extractedEntities: jsonb('extracted_entities'),
  
  // Status tracking
  deliveryStatus: text('delivery_status').default('sent'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
}, (table) => ({
  sessionIdx: index('idx_whatsapp_conversations_session').on(table.sessionId),
  phoneIdx: index('idx_whatsapp_conversations_phone').on(table.phoneNumber),
  createdIdx: index('idx_whatsapp_conversations_created').on(table.createdAt),
}));

// Type exports
export type WhatsAppSession = typeof whatsappSessions.$inferSelect;
export type NewWhatsAppSession = typeof whatsappSessions.$inferInsert;

export type WhatsAppMedia = typeof whatsappMedia.$inferSelect;
export type NewWhatsAppMedia = typeof whatsappMedia.$inferInsert;

export type WhatsAppTemplate = typeof whatsappTemplates.$inferSelect;
export type NewWhatsAppTemplate = typeof whatsappTemplates.$inferInsert;

export type WhatsAppConversation = typeof whatsappConversations.$inferSelect;
export type NewWhatsAppConversation = typeof whatsappConversations.$inferInsert;

// Interface for session context
export interface SessionContext {
  currentState: 'idle' | 'collecting_task' | 'processing_image' | 'confirming' | 'editing';
  partialTask?: {
    title?: string;
    scheduledAt?: string;
    phoneNumber?: string;
    priority?: string;
    projectId?: string;
  };
  lastIntent?: string;
  lastMediaId?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  userPreferences?: {
    defaultRemindTime?: string;
    confirmBeforeCreate?: boolean;
    language?: string;
  };
}

// Interface for extracted data from images
export interface ExtractedImageData {
  type: 'receipt' | 'business_card' | 'task_list' | 'document' | 'screenshot';
  confidence: number;
  extractedTasks?: Array<{
    title: string;
    dueDate?: string;
    priority?: string;
  }>;
  receiptData?: {
    vendor: string;
    amount: number;
    date: string;
    items?: Array<{ name: string; price: number }>;
  };
  contactData?: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    title?: string;
  };
  rawText?: string;
}