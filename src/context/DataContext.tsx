import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import type {
  AppData,
  Assignment,
  AssignmentInput,
  Lecture,
  LectureInput,
  Priority,
  Project,
  ProjectInput,
  ProjectStatus,
  SessionInput,
  StudySession,
  Tone,
} from '../data/models'
import { requireSupabase } from '../lib/supabase'

type DataContextValue = AppData & {
  loading: boolean
  error: string
  reload: () => Promise<void>
  addProject: (input: ProjectInput) => Promise<Project>
  updateProject: (id: string, input: Partial<ProjectInput>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  addAssignment: (input: AssignmentInput) => Promise<Assignment>
  updateAssignment: (id: string, input: Partial<AssignmentInput>) => Promise<Assignment>
  toggleAssignment: (id: string) => Promise<void>
  deleteAssignment: (id: string) => Promise<void>
  addLecture: (input: LectureInput) => Promise<Lecture>
  updateLecture: (id: string, input: Partial<LectureInput>) => Promise<Lecture>
  deleteLecture: (id: string) => Promise<void>
  importLectures: (
    inputs: LectureInput[],
    mode: 'merge' | 'replace',
  ) => Promise<{ added: number; skipped: number }>
  addSession: (input: SessionInput) => Promise<StudySession>
  deleteSession: (id: string) => Promise<void>
  resetData: () => Promise<void>
}

type ProjectRow = {
  id: string
  name: string
  description: string
  stack: string[] | null
  status: string
  progress: number
  start_date: string
  due_at: string
  estimated_hours: number | string
  tone: string
  created_at: string
}

type AssignmentRow = {
  id: string
  title: string
  course: string
  description: string
  due_at: string
  priority: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

type LectureRow = {
  id: string
  course: string
  title: string
  day: number
  start_time: string
  end_time: string
  location: string
  tone: string
}

type SessionRow = {
  id: string
  subject: string
  topic: string
  minutes: number
  date: string
  created_at: string
}

const DataContext = createContext<DataContextValue | null>(null)

const emptyData = (): AppData => ({
  projects: [],
  assignments: [],
  lectures: [],
  sessions: [],
})

function lectureKey(lecture: LectureInput): string {
  return [
    lecture.day,
    lecture.startTime,
    lecture.endTime,
    lecture.course.trim().toLowerCase(),
    lecture.title.trim().toLowerCase(),
    lecture.location.trim().toLowerCase(),
  ].join('|')
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    stack: row.stack ?? [],
    status: row.status as ProjectStatus,
    progress: row.progress,
    startDate: row.start_date,
    dueAt: row.due_at,
    estimatedHours: Number(row.estimated_hours),
    tone: row.tone as Tone,
    createdAt: row.created_at,
  }
}

function toAssignment(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    title: row.title,
    course: row.course,
    description: row.description,
    dueAt: row.due_at,
    priority: row.priority as Priority,
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

function toLecture(row: LectureRow): Lecture {
  return {
    id: row.id,
    course: row.course,
    title: row.title,
    day: row.day,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    location: row.location,
    tone: row.tone as Tone,
  }
}

function toSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    subject: row.subject,
    topic: row.topic,
    minutes: row.minutes,
    date: row.date,
    createdAt: row.created_at,
  }
}

function projectPatch(input: Partial<ProjectInput>) {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined) patch.description = input.description
  if (input.stack !== undefined) patch.stack = input.stack
  if (input.status !== undefined) patch.status = input.status
  if (input.progress !== undefined) patch.progress = input.progress
  if (input.startDate !== undefined) patch.start_date = input.startDate
  if (input.dueAt !== undefined) patch.due_at = input.dueAt
  if (input.estimatedHours !== undefined) patch.estimated_hours = input.estimatedHours
  if (input.tone !== undefined) patch.tone = input.tone
  return patch
}

function assignmentPatch(input: Partial<AssignmentInput>) {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.course !== undefined) patch.course = input.course
  if (input.description !== undefined) patch.description = input.description
  if (input.dueAt !== undefined) patch.due_at = input.dueAt
  if (input.priority !== undefined) patch.priority = input.priority
  return patch
}

function lecturePatch(input: Partial<LectureInput>) {
  const patch: Record<string, unknown> = {}
  if (input.course !== undefined) patch.course = input.course
  if (input.title !== undefined) patch.title = input.title
  if (input.day !== undefined) patch.day = input.day
  if (input.startTime !== undefined) patch.start_time = input.startTime
  if (input.endTime !== undefined) patch.end_time = input.endTime
  if (input.location !== undefined) patch.location = input.location
  if (input.tone !== undefined) patch.tone = input.tone
  return patch
}

async function fetchData(): Promise<AppData> {
  const client = requireSupabase()
  const [projects, assignments, lectures, sessions] = await Promise.all([
    client.from('projects').select('*').order('created_at', { ascending: false }),
    client.from('assignments').select('*').order('due_at', { ascending: true }),
    client.from('lectures').select('*').order('day').order('start_time'),
    client.from('study_sessions').select('*').order('date', { ascending: false }),
  ])

  const failure = projects.error ?? assignments.error ?? lectures.error ?? sessions.error
  if (failure) throw new Error(failure.message)

  return {
    projects: (projects.data as ProjectRow[]).map(toProject),
    assignments: (assignments.data as AssignmentRow[]).map(toAssignment),
    lectures: (lectures.data as LectureRow[]).map(toLecture),
    sessions: (sessions.data as SessionRow[]).map(toSession),
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [data, setData] = useState<AppData>(emptyData)
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!userId) {
      setData(emptyData())
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setData(await fetchData())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load your workspace.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  const addProject = useCallback(
    async (input: ProjectInput) => {
      const { data: row, error: failure } = await requireSupabase()
        .from('projects')
        .insert({
          user_id: userId,
          name: input.name,
          description: input.description,
          stack: input.stack,
          status: input.status,
          progress: input.progress,
          start_date: input.startDate,
          due_at: input.dueAt,
          estimated_hours: input.estimatedHours,
          tone: input.tone,
        })
        .select()
        .single()
      if (failure) throw new Error(failure.message)
      const project = toProject(row as ProjectRow)
      setData((current) => ({ ...current, projects: [project, ...current.projects] }))
      return project
    },
    [userId],
  )

  const updateProject = useCallback(async (id: string, input: Partial<ProjectInput>) => {
    const { data: row, error: failure } = await requireSupabase()
      .from('projects')
      .update(projectPatch(input))
      .eq('id', id)
      .select()
      .single()
    if (failure) throw new Error(failure.message)
    const project = toProject(row as ProjectRow)
    setData((current) => ({
      ...current,
      projects: current.projects.map((entry) => (entry.id === id ? project : entry)),
    }))
    return project
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    const { error: failure } = await requireSupabase().from('projects').delete().eq('id', id)
    if (failure) throw new Error(failure.message)
    setData((current) => ({
      ...current,
      projects: current.projects.filter((entry) => entry.id !== id),
    }))
  }, [])

  const addAssignment = useCallback(
    async (input: AssignmentInput) => {
      const { data: row, error: failure } = await requireSupabase()
        .from('assignments')
        .insert({
          user_id: userId,
          title: input.title,
          course: input.course,
          description: input.description,
          due_at: input.dueAt,
          priority: input.priority,
        })
        .select()
        .single()
      if (failure) throw new Error(failure.message)
      const assignment = toAssignment(row as AssignmentRow)
      setData((current) => ({
        ...current,
        assignments: [assignment, ...current.assignments],
      }))
      return assignment
    },
    [userId],
  )

  const updateAssignment = useCallback(
    async (id: string, input: Partial<AssignmentInput>) => {
      const { data: row, error: failure } = await requireSupabase()
        .from('assignments')
        .update(assignmentPatch(input))
        .eq('id', id)
        .select()
        .single()
      if (failure) throw new Error(failure.message)
      const assignment = toAssignment(row as AssignmentRow)
      setData((current) => ({
        ...current,
        assignments: current.assignments.map((entry) => (entry.id === id ? assignment : entry)),
      }))
      return assignment
    },
    [],
  )

  const toggleAssignment = useCallback(
    async (id: string) => {
      const current = data.assignments.find((entry) => entry.id === id)
      if (!current) return
      const completed = !current.completed
      const { data: row, error: failure } = await requireSupabase()
        .from('assignments')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single()
      if (failure) throw new Error(failure.message)
      const assignment = toAssignment(row as AssignmentRow)
      setData((state) => ({
        ...state,
        assignments: state.assignments.map((entry) => (entry.id === id ? assignment : entry)),
      }))
    },
    [data.assignments],
  )

  const deleteAssignment = useCallback(async (id: string) => {
    const { error: failure } = await requireSupabase().from('assignments').delete().eq('id', id)
    if (failure) throw new Error(failure.message)
    setData((current) => ({
      ...current,
      assignments: current.assignments.filter((entry) => entry.id !== id),
    }))
  }, [])

  const addLecture = useCallback(
    async (input: LectureInput) => {
      const { data: row, error: failure } = await requireSupabase()
        .from('lectures')
        .insert({
          user_id: userId,
          course: input.course,
          title: input.title,
          day: input.day,
          start_time: input.startTime,
          end_time: input.endTime,
          location: input.location,
          tone: input.tone,
        })
        .select()
        .single()
      if (failure) throw new Error(failure.message)
      const lecture = toLecture(row as LectureRow)
      setData((current) => ({ ...current, lectures: [...current.lectures, lecture] }))
      return lecture
    },
    [userId],
  )

  const updateLecture = useCallback(async (id: string, input: Partial<LectureInput>) => {
    const { data: row, error: failure } = await requireSupabase()
      .from('lectures')
      .update(lecturePatch(input))
      .eq('id', id)
      .select()
      .single()
    if (failure) throw new Error(failure.message)
    const lecture = toLecture(row as LectureRow)
    setData((current) => ({
      ...current,
      lectures: current.lectures.map((entry) => (entry.id === id ? lecture : entry)),
    }))
    return lecture
  }, [])

  const deleteLecture = useCallback(async (id: string) => {
    const { error: failure } = await requireSupabase().from('lectures').delete().eq('id', id)
    if (failure) throw new Error(failure.message)
    setData((current) => ({
      ...current,
      lectures: current.lectures.filter((entry) => entry.id !== id),
    }))
  }, [])

  const importLectures = useCallback(
    async (inputs: LectureInput[], mode: 'merge' | 'replace') => {
      const client = requireSupabase()
      const base = mode === 'replace' ? [] : data.lectures
      const seen = new Set(base.map(lectureKey))
      const lectures: LectureInput[] = []
      let skipped = 0

      for (const input of inputs) {
        const key = lectureKey(input)
        if (seen.has(key)) {
          skipped += 1
          continue
        }
        seen.add(key)
        lectures.push(input)
      }

      if (mode === 'replace') {
        const { error: failure } = await client.from('lectures').delete().eq('user_id', userId)
        if (failure) throw new Error(failure.message)
      }

      if (lectures.length === 0) {
        if (mode === 'replace') setData((current) => ({ ...current, lectures: [] }))
        return { added: 0, skipped }
      }

      const { data: rows, error: failure } = await client
        .from('lectures')
        .insert(
          lectures.map((lecture) => ({
            user_id: userId,
            course: lecture.course,
            title: lecture.title,
            day: lecture.day,
            start_time: lecture.startTime,
            end_time: lecture.endTime,
            location: lecture.location,
            tone: lecture.tone,
          })),
        )
        .select()
      if (failure) throw new Error(failure.message)
      const inserted = (rows as LectureRow[]).map(toLecture)
      setData((current) => ({
        ...current,
        lectures: mode === 'replace' ? inserted : [...current.lectures, ...inserted],
      }))
      return { added: inserted.length, skipped }
    },
    [data.lectures, userId],
  )

  const addSession = useCallback(
    async (input: SessionInput) => {
      const { data: row, error: failure } = await requireSupabase()
        .from('study_sessions')
        .insert({
          user_id: userId,
          subject: input.subject,
          topic: input.topic,
          minutes: input.minutes,
          date: input.date,
        })
        .select()
        .single()
      if (failure) throw new Error(failure.message)
      const session = toSession(row as SessionRow)
      setData((current) => ({ ...current, sessions: [session, ...current.sessions] }))
      return session
    },
    [userId],
  )

  const deleteSession = useCallback(async (id: string) => {
    const { error: failure } = await requireSupabase()
      .from('study_sessions')
      .delete()
      .eq('id', id)
    if (failure) throw new Error(failure.message)
    setData((current) => ({
      ...current,
      sessions: current.sessions.filter((entry) => entry.id !== id),
    }))
  }, [])

  const resetData = useCallback(async () => {
    const client = requireSupabase()
    const tables = ['projects', 'assignments', 'lectures', 'study_sessions']
    const results = await Promise.all(
      tables.map((table) => client.from(table).delete().eq('user_id', userId)),
    )
    const failure = results.find((result) => result.error)?.error
    if (failure) throw new Error(failure.message)
    setData(emptyData())
  }, [userId])

  const value = useMemo<DataContextValue>(
    () => ({
      ...data,
      loading,
      error,
      reload,
      addProject,
      updateProject,
      deleteProject,
      addAssignment,
      updateAssignment,
      toggleAssignment,
      deleteAssignment,
      addLecture,
      updateLecture,
      deleteLecture,
      importLectures,
      addSession,
      deleteSession,
      resetData,
    }),
    [
      data,
      loading,
      error,
      reload,
      addProject,
      updateProject,
      deleteProject,
      addAssignment,
      updateAssignment,
      toggleAssignment,
      deleteAssignment,
      addLecture,
      updateLecture,
      deleteLecture,
      importLectures,
      addSession,
      deleteSession,
      resetData,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}
