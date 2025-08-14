import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password'),
  role: text('role', { enum: ['admin', 'moderator', 'user'] }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const words = pgTable('words', {
  id: uuid('id').defaultRandom().primaryKey(),
  germanWord: text('german_word').notNull(),
  englishTranslation: text('english_translation'),
  banglaTranslation: text('bangla_translation'),
  exampleSentence: text('example_sentence'),
  notes: text('notes'),
  section: text('section').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  important: boolean('important').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userWords = pgTable('user_words', {
  id: uuid('id').defaultRandom().primaryKey(),
  originalWordId: uuid('original_word_id')
    .notNull()
    .references(() => words.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  modifications: jsonb('modifications'),
});

// Learning progress tracking
export const learningProgress = pgTable('learning_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  wordId: uuid('word_id').notNull().references(() => words.id),
  // Mastery level: 0 (new) to 5 (mastered)
  masteryLevel: integer('mastery_level').notNull().default(0),
  // Next review date based on spaced repetition
  nextReviewDate: timestamp('next_review_date').notNull(),
  // Total number of correct/incorrect attempts
  correctAttempts: integer('correct_attempts').notNull().default(0),
  incorrectAttempts: integer('incorrect_attempts').notNull().default(0),
  // Last review date
  lastReviewedAt: timestamp('last_reviewed_at'),
  // Learning direction preferences (e.g., "german_to_english", "english_to_german")
  preferredDirection: text('preferred_direction').notNull().default('german_to_english'),
  // important: boolean('important').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Learning sessions
export const learningSessions = pgTable('learning_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  // Session type: "review", "new_words", "mistakes", etc.
  sessionType: text('session_type').notNull(),
  // Learning direction for this session
  direction: text('direction').notNull(),
  // Section filter (if any) - now supports multiple sections
  sections: jsonb('sections').default([]),
  // Session status: "in_progress", "completed", "abandoned"
  status: text('status').notNull().default('in_progress'),
  // Session statistics
  totalWords: integer('total_words').notNull().default(0),
  correctAnswers: integer('correct_answers').notNull().default(0),
  incorrectAnswers: integer('incorrect_answers').notNull().default(0),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Session words (words included in a learning session)
export const sessionWords = pgTable('session_words', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => learningSessions.id),
  wordId: uuid('word_id').notNull().references(() => words.id),
  // Whether the word was answered correctly in this session
  isCorrect: boolean('is_correct'),
  // The user's answer (if any)
  userAnswer: text('user_answer'),
  // When the word was presented
  presentedAt: timestamp('presented_at').notNull().defaultNow(),
  // When the word was answered (if answered)
  answeredAt: timestamp('answered_at'),
  // Order in which the word was presented
  presentationOrder: integer('presentation_order').notNull(),
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

export const learningProgressRelations = relations(learningProgress, ({ one }) => ({
  user: one(users, {
    fields: [learningProgress.userId],
    references: [users.id],
  }),
  word: one(words, {
    fields: [learningProgress.wordId],
    references: [words.id],
  }),
}));

export const learningSessionsRelations = relations(learningSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [learningSessions.userId],
    references: [users.id],
  }),
  sessionWords: many(sessionWords),
}));

export const sessionWordsRelations = relations(sessionWords, ({ one }) => ({
  session: one(learningSessions, {
    fields: [sessionWords.sessionId],
    references: [learningSessions.id],
  }),
  word: one(words, {
    fields: [sessionWords.wordId],
    references: [words.id],
  }),
}));