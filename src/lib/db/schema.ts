import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['admin', 'moderator', 'user'] }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const words = pgTable('words', {
  id: uuid('id').primaryKey().defaultRandom(),
  germanWord: text('german_word').notNull(),
  englishTranslation: text('english_translation'),
  banglaTranslation: text('bangla_translation'),
  exampleSentence: text('example_sentence'),
  notes: text('notes'),
  section: integer('section').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userWords = pgTable('user_words', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalWordId: uuid('original_word_id').references(() => words.id),
  userId: uuid('user_id').references(() => users.id),
  modifications: jsonb('modifications'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const wordsRelations = relations(words, ({ one }) => ({
  creator: one(users, {
    fields: [words.createdBy],
    references: [users.id],
  }),
}));

export const userWordsRelations = relations(userWords, ({ one }) => ({
  word: one(words, {
    fields: [userWords.originalWordId],
    references: [words.id],
  }),
  user: one(users, {
    fields: [userWords.userId],
    references: [users.id],
  }),
})); 