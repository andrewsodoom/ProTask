export type ProjectStatus = 'Planning' | 'In build' | 'Research' | 'Polish' | 'Shipped'
export type Tone = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose'

export type Project = {
  id: string
  name: string
  description: string
  stack: string[]
  status: ProjectStatus
  progress: number
  startDate: string
  dueAt: string
  estimatedHours: number
  tone: Tone
  createdAt: string
}

export type Priority = 'High' | 'Medium' | 'Low'

export type Assignment = {
  id: string
  title: string
  course: string
  description: string
  dueAt: string
  priority: Priority
  completed: boolean
  completedAt: string | null
  createdAt: string
}

export type Lecture = {
  id: string
  course: string
  title: string
  day: number
  startTime: string
  endTime: string
  location: string
  tone: Tone
}

export type StudySession = {
  id: string
  subject: string
  topic: string
  minutes: number
  date: string
  createdAt: string
}

export type AppData = {
  projects: Project[]
  assignments: Assignment[]
  lectures: Lecture[]
  sessions: StudySession[]
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt'>
export type AssignmentInput = Omit<
  Assignment,
  'id' | 'createdAt' | 'completed' | 'completedAt'
>
export type LectureInput = Omit<Lecture, 'id'>
export type SessionInput = Omit<StudySession, 'id' | 'createdAt'>

export type AuthUser = {
  id: string
  name: string
  email: string
  createdAt: string
}
