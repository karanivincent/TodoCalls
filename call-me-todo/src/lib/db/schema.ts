import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  varchar,
  integer,
  jsonb,
  index,
  pgEnum,
  check,
} from 'drizzle-orm/pg-core';

// Enums
export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'completed', 
  'snoozed',
  'failed'
]);

export const priorityEnum = pgEnum('priority', [
  'low',
  'medium', 
  'high',
  'urgent'
]);

export const energyLevelEnum = pgEnum('energy_level', [
  'low',
  'medium',
  'high'
]);

// User Profiles table (existing)
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  phone_number: text('phone_number'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`NOW()`),
});

// Phone Numbers table (matches actual database)
export const phoneNumbers = pgTable('phone_numbers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').references(() => userProfiles.id, { onDelete: 'cascade' }).notNull(),
  phone_number: text('phone_number').notNull(),
  label: text('label'),
  is_primary: boolean('is_primary').default(false),
  is_verified: boolean('is_verified').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`NOW()`),
});

// Projects table (new) - references auth.users directly
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(), // References auth.users.id (managed by Supabase)
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#6366f1'),
  is_archived: boolean('is_archived').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index('projects_user_id_idx').on(table.user_id),
  userIdArchivedIdx: index('projects_user_id_archived_idx').on(table.user_id, table.is_archived),
}));

// Enhanced Tasks table (matches actual database)
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').references(() => userProfiles.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  phone_number: text('phone_number').notNull(),
  scheduled_at: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  status: text('status').default('pending'),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`NOW()`),
  notify_by_phone: boolean('notify_by_phone').default(true),
  notify_by_text: boolean('notify_by_text').default(false),
  notify_by_email: boolean('notify_by_email').default(false),
  last_call_attempt: timestamp('last_call_attempt', { withTimezone: true }),
  retry_count: integer('retry_count').default(0),
  // Enhanced fields
  description: text('description'),
  due_date: timestamp('due_date', { withTimezone: true }),
  priority: priorityEnum('priority').default('medium'),
  tags: text('tags').array().default(sql`'{}'`),
  project_id: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  parent_task_id: uuid('parent_task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  recurrence_pattern: jsonb('recurrence_pattern'),
  estimated_duration: integer('estimated_duration'),
  actual_duration: integer('actual_duration'),
  energy_level: energyLevelEnum('energy_level'),
}, (table) => ({
  userIdIdx: index('tasks_user_id_idx').on(table.user_id),
  projectIdIdx: index('tasks_project_id_idx').on(table.project_id),
  priorityIdx: index('tasks_priority_idx').on(table.priority),
  dueDateIdx: index('tasks_due_date_idx').on(table.due_date),
  parentTaskIdIdx: index('tasks_parent_task_id_idx').on(table.parent_task_id),
  userIdStatusScheduledIdx: index('tasks_user_id_status_scheduled_idx').on(table.user_id, table.status, table.scheduled_at),
}));

// Contact Messages table (existing)
export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
});

// Type exports for use in application
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type NewPhoneNumber = typeof phoneNumbers.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

// Enhanced types
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'completed' | 'snoozed' | 'failed';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  days_of_week?: number[];
  end_date?: string;
}