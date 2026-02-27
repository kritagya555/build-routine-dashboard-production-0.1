// Database Schema Documentation
// This schema is designed to be easily migrated to PostgreSQL/Supabase with Prisma
/*
-- Database Schema (PostgreSQL/Prisma)

model User {
  id              String          @id @default(uuid())
  email           String          @unique
  name            String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  studyTasks      StudyTask[]
  dietLogs        DietLog[]
  workoutLogs     WorkoutLog[]
  generalTasks    GeneralTask[]
  weeklyGoals     WeeklyGoal[]
  nutritionGoal   NutritionGoal?
  customFoods     CustomFood[]
}

model NutritionGoal {
  id             String    @id @default(uuid())
  userId         String    @unique
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  goalType       GoalType
  targetCalories Int
  targetProtein  Int
  targetCarbs    Int
  targetFats     Int

  heightCm       Float
  weightKg       Float
  age            Int
  gender         Gender
  activityLevel  ActivityLevel

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model CustomFood {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name         String
  nameHindi    String?
  category     String
  calories100g Float
  protein100g  Float
  carbs100g    Float
  fats100g     Float
  fiber100g    Float?
  servingSize  Float?
  servingUnit  String?

  createdAt    DateTime @default(now())
}

enum GoalType {
  BULK
  MAINTAIN
  CUT
}

enum Gender {
  MALE
  FEMALE
}

enum ActivityLevel {
  SEDENTARY       // 1.2
  LIGHTLY_ACTIVE  // 1.375
  MODERATELY_ACTIVE // 1.55
  VERY_ACTIVE     // 1.725
  EXTRA_ACTIVE    // 1.9
}

model StudyTask {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  title       String
  subject     String
  priority    Priority    @default(MEDIUM)
  deadline    DateTime?
  status      TaskStatus  @default(PENDING)
  studyTime   Int         @default(0)  // in minutes
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model DietLog {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  date        DateTime
  mealType    MealType
  description String
  calories    Int
  protein     Float
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model WorkoutLog {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  date        DateTime
  exercises   Exercise[]
  completed   Boolean     @default(false)
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Exercise {
  id            String      @id @default(uuid())
  workoutLogId  String
  workoutLog    WorkoutLog  @relation(fields: [workoutLogId], references: [id])
  name          String
  sets          Int
  reps          Int
  weight        Float?
  completed     Boolean     @default(false)
}

model GeneralTask {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  title       String
  status      TaskStatus  @default(PENDING)
  isRecurring Boolean     @default(false)
  recurType   RecurType?
  order       Int         @default(0)
  dueDate     DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model WeeklyGoal {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  weekStart     DateTime
  studyHours    Int       @default(0)
  calorieTarget Int       @default(2000)
  workoutDays   Int       @default(5)
  tasksTarget   Int       @default(10)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum TaskStatus {
  PENDING
  COMPLETED
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

enum RecurType {
  DAILY
  WEEKLY
  MONTHLY
}
*/

// TypeScript Types (Frontend)
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'COMPLETED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type RecurType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type FoodCategory = 'grain' | 'protein' | 'vegetable' | 'fruit' | 'dairy' | 'legume' | 'snack' | 'beverage' | 'sweet' | 'oil' | 'spice';
export type GoalType = 'BULK' | 'MAINTAIN' | 'CUT';
export type Gender = 'MALE' | 'FEMALE';
export type ActivityLevel = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';

// FoodItem Database Model (Indian Foods)
// Prisma Schema:
/*
model FoodItem {
  id           String   @id @default(uuid())
  name         String   @unique
  nameHindi    String?
  category     String
  calories100g Float
  protein100g  Float
  carbs100g    Float
  fats100g     Float
  fiber100g    Float?
  servingSize  Float?   // typical serving in grams
  servingUnit  String?  // e.g., "piece", "cup", "bowl"
  createdAt    DateTime @default(now())
  meals        MealItem[]
}

model MealItem {
  id        String   @id @default(uuid())
  mealId    String
  meal      DietLog  @relation(fields: [mealId], references: [id], onDelete: Cascade)
  foodId    String
  food      FoodItem @relation(fields: [foodId], references: [id])
  quantity  Float    // in grams
  calories  Float    // calculated: (calories100g * quantity) / 100
  protein   Float    // calculated
  carbs     Float    // calculated
  fats      Float    // calculated
}
*/

export interface FoodItem {
  id: string;
  name: string;
  nameHindi?: string;
  category: FoodCategory;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fats100g: number;
  fiber100g?: number;
  servingSize?: number;
  servingUnit?: string;
  createdAt: string;
}

export interface MealItem {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number; // in grams
  calories: number; // auto-calculated
  protein: number;  // auto-calculated
  carbs: number;    // auto-calculated
  fats: number;     // auto-calculated
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  priority: Priority;
  deadline: string | null;
  status: TaskStatus;
  studyTime: number; // in minutes
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DietLog {
  id: string;
  date: string;
  mealType: MealType;
  items: MealItem[]; // food items with quantities
  totalCalories: number; // sum of all items
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  completed: boolean;
}

export interface WorkoutLog {
  id: string;
  date: string;
  exercises: Exercise[];
  completed: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplate {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ...
  exercises: Exercise[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralTask {
  id: string;
  title: string;
  status: TaskStatus;
  isRecurring: boolean;
  recurType: RecurType | null;
  order: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyGoal {
  id: string;
  weekStart: string;
  studyHours: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  workoutDays: number;
  tasksTarget: number;
}

export interface NutritionGoal {
  id: string;
  goalType: GoalType;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFood {
  id: string;
  name: string;
  nameHindi?: string;
  category: FoodCategory;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fats100g: number;
  fiber100g?: number;
  servingSize?: number;
  servingUnit?: string;
  isCustom: boolean;
  createdAt: string;
}

export interface BMIResult {
  value: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  color: string;
}

export interface WeeklyMacroAverage {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  daysLogged: number;
}

export interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export type FilterStatus = 'ALL' | 'PENDING' | 'COMPLETED';


