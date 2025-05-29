import {
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Users Table
 *
 * This table stores all application users.
 * - Each user is uniquely identified by a Clerk user ID
 * - Timezone is stored for scheduling daily tasks and cron jobs
 */
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    timezone: text("timezone").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Routines Table
 *
 * This table defines routines belonging to users.
 * - Routines contain multiple stages and thresholds
 * - Tracks user progress via currentStage and status
 */
export const routines = pgTable("routines", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    routineInfo: text("routine_info").notNull(),
    routineType: text("routine_type", { enum: ["template", "standard", "special"] }).notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    stages: integer("stages").notNull(),
    thresholds: integer("thresholds").array().notNull(),
    currentStage: integer("current_stage").notNull(),
    currentStageProgress: integer("current_stage_progress").notNull(),
    status: text("status", { enum: ["active", "paused", "finished", "abandoned"] }).default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Task Sets Table
 *
 * This table defines collections of tasks within a specific routine stage.
 * - Each routine can have multiple task sets, each assigned to a stage
 */
export const taskSets = pgTable("task_sets", {
    id: uuid("id").defaultRandom().primaryKey(),
    routineId: uuid("routine_id").notNull().references(() => routines.id),
    stageNumber: integer("stage_number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    scheduledHour: integer("scheduled_hour").notNull(),
    scheduledMinute: integer("scheduled_minute").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Tasks Table (Template)
 *
 * This table defines template tasks belonging to task sets.
 * - Tasks can optionally be nested (subtasks) using parentId
 * - Tasks serve as blueprints for daily active tasks
 */
export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    taskSetId: uuid("task_set_id").notNull().references(() => taskSets.id),
    parentId: uuid("parent_id"),
    title: text("title").notNull(),
    description: text("description"),
    isOptional: boolean("is_optional").default(false),
    order: integer("order"),
    status: text("status", { enum: ["todo", "in_progress", "completed", "missed"] }).default("todo"),
    duration: integer("duration"),
    streak: integer("streak"),
    scheduledFor: timestamp("scheduled_for"),
    completedAt: timestamp("completed_at"),
    missedAt: timestamp("missed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Active Tasks Table
 *
 * This table stores active daily task instances served to users.
 * - Generated from template tasks each day at 5:00am user local time
 * - Tracks daily user progress and status changes
 */
export const activeTasks = pgTable("active_tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    routineId: uuid("routine_id").notNull().references(() => routines.id),
    originalTaskId: uuid("original_task_id").references(() => tasks.id),
    title: text("title").notNull(),
    description: text("description"),
    isOptional: boolean("is_optional").default(false),
    order: integer("order"),
    status: text("status", { enum: ["todo", "in_progress", "completed", "missed"] }).default("todo"),
    scheduledFor: timestamp("scheduled_for").notNull(),
    completedAt: timestamp("completed_at"),
    missedAt: timestamp("missed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Task History Table
 *
 * This table stores archived daily tasks after midnight cron runs.
 * - Records completed and missed tasks for audit and tracking purposes
 */
export const taskHistory = pgTable("task_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    routineId: uuid("routine_id").references(() => routines.id),
    originalTaskId: uuid("original_task_id").references(() => tasks.id),
    activeTaskId: uuid("active_task_id").references(() => activeTasks.id),
    title: text("title").notNull(),
    description: text("description"),
    isOptional: boolean("is_optional").default(false),
    status: text("status", { enum: ["completed", "missed", "skipped"] }).notNull(),
    scheduledFor: timestamp("scheduled_for").notNull(),
    completedAt: timestamp("completed_at"),
    missedAt: timestamp("missed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Unmarked Tasks Table
 *
 * This table captures any active tasks left unmarked at the end of the day.
 * - Allows tracking and optional rescue of uncompleted tasks after daily cutoff
 */
export const unmarkedTasks = pgTable("unmarked_tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    routineId: uuid("routine_id").references(() => routines.id),
    originalTaskId: uuid("original_task_id").references(() => tasks.id),
    activeTaskId: uuid("active_task_id").references(() => activeTasks.id),
    title: text("title").notNull(),
    description: text("description"),
    isOptional: boolean("is_optional").default(false),
    scheduledFor: timestamp("scheduled_for").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    routines: many(routines),
    activeTasks: many(activeTasks),
    taskHistory: many(taskHistory),
    unmarkedTasks: many(unmarkedTasks),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
    user: one(users, {
        fields: [routines.userId],
        references: [users.id],
    }),
    taskSets: many(taskSets),
    activeTasks: many(activeTasks),
    taskHistory: many(taskHistory),
    unmarkedTasks: many(unmarkedTasks),
}));

export const taskSetsRelations = relations(taskSets, ({ one, many }) => ({
    routine: one(routines, {
        fields: [taskSets.routineId],
        references: [routines.id],
    }),
    tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    taskSet: one(taskSets, {
        fields: [tasks.taskSetId],
        references: [taskSets.id],
    }),
    parentTask: one(tasks, {
        fields: [tasks.parentId],
        references: [tasks.id],
    }),
    subtasks: many(tasks, {
        relationName: 'taskHierarchy',
    }),
    activeTasks: many(activeTasks, {
        relationName: 'templateToActive',
    }),
    taskHistory: many(taskHistory, {
        relationName: 'templateToHistory',
    }),
}));

export const activeTasksRelations = relations(activeTasks, ({ one }) => ({
    user: one(users, {
        fields: [activeTasks.userId],
        references: [users.id],
    }),
    routine: one(routines, {
        fields: [activeTasks.routineId],
        references: [routines.id],
    }),
    originalTask: one(tasks, {
        fields: [activeTasks.originalTaskId],
        references: [tasks.id],
    }),
}));

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
    user: one(users, {
        fields: [taskHistory.userId],
        references: [users.id],
    }),
    routine: one(routines, {
        fields: [taskHistory.routineId],
        references: [routines.id],
    }),
    originalTask: one(tasks, {
        fields: [taskHistory.originalTaskId],
        references: [tasks.id],
    }),
    activeTask: one(activeTasks, {
        fields: [taskHistory.activeTaskId],
        references: [activeTasks.id],
    }),
}));

export const unmarkedTasksRelations = relations(unmarkedTasks, ({ one }) => ({
    user: one(users, {
        fields: [unmarkedTasks.userId],
        references: [users.id],
    }),
    routine: one(routines, {
        fields: [unmarkedTasks.routineId],
        references: [routines.id],
    }),
    originalTask: one(tasks, {
        fields: [unmarkedTasks.originalTaskId],
        references: [tasks.id],
    }),
    activeTask: one(activeTasks, {
        fields: [unmarkedTasks.activeTaskId],
        references: [activeTasks.id],
    }),
}));