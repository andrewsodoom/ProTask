import type { LectureInput, Tone } from '../data/models'
import { TONES } from './tone'

type Cell = string | number | boolean | Date | null | undefined
type SheetRow = Cell[]

type HeaderField = 'day' | 'course' | 'title' | 'start' | 'end' | 'location' | 'time'

type ColumnMap = Partial<Record<HeaderField, number>>

type TimeRange = {
  start: string
  end: string
  matched?: string
}

export type TimetableIssue = {
  row: number
  message: string
}

export type TimetableParseResult = {
  lectures: LectureInput[]
  issues: TimetableIssue[]
  format: 'table' | 'grid'
  sheet?: string
}

const HEADER_ALIASES: Record<HeaderField, string[]> = {
  day: ['day', 'days', 'weekday', 'dayofweek', 'dayname', 'teachingday'],
  course: [
    'course',
    'coursecode',
    'coursename',
    'module',
    'modulecode',
    'moduleid',
    'subjectcode',
    'papercode',
    'unitcode',
    'classcode',
    'code',
  ],
  title: [
    'title',
    'lecture',
    'class',
    'classname',
    'name',
    'modulename',
    'moduletitle',
    'coursetitle',
    'subjectname',
    'papername',
    'unitname',
    'subject',
    'activity',
    'description',
  ],
  start: ['start', 'starttime', 'timestart', 'starts', 'from', 'begin', 'commence', 'timefrom'],
  end: ['end', 'endtime', 'timeend', 'ends', 'to', 'finish', 'until', 'timeto'],
  location: [
    'location',
    'room',
    'roomnumber',
    'classroom',
    'venue',
    'place',
    'building',
    'where',
  ],
  time: [
    'time',
    'timeslot',
    'period',
    'slot',
    'timeblock',
    'schedule',
    'when',
    'datetime',
    'classschedule',
  ],
}

const HEADER_LOOKUP = new Map<string, HeaderField>()
for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<[HeaderField, string[]]>) {
  for (const alias of aliases) HEADER_LOOKUP.set(normalizeToken(alias), field)
}

const HEADER_FUZZY = Array.from(HEADER_LOOKUP.entries()).sort((a, b) => b[0].length - a[0].length)

const DAY_PATTERNS: Array<[RegExp, number]> = [
  [/^(monday|mon)(?![a-z])/i, 0],
  [/^(tuesday|tues|tue)(?![a-z])/i, 1],
  [/^(wednesday|weds|wed)(?![a-z])/i, 2],
  [/^(thursday|thurs|thur|thu)(?![a-z])/i, 3],
  [/^(friday|fri)(?![a-z])/i, 4],
  [/^(saturday|sat)(?![a-z])/i, 5],
  [/^(sunday|sun)(?![a-z])/i, 6],
]

const LOCATION_PREFIX = /^(room|rm\.?|hall|lab|laboratory|building|venue|location|campus)\b/i
const ROOM_ONLY = /^[A-Z]{1,3}[-\s]?\d{1,4}[A-Z]?$/i
const COURSE_CODE = /\b([A-Z]{2,6}\s?-?\s?\d{2,4}[A-Z]?)\b/

export const TIMETABLE_TEMPLATE = [
  'Day,Course,Title,Start,End,Location',
  'Monday,CS 402,Machine Learning,09:00,10:30,Room B204',
  'Tuesday,MATH 301,Linear Algebra,11:00,12:30,Hall 2',
  'Wednesday,CS 402,ML Lab,14:00,16:00,Lab C',
].join('\n')

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function headerField(cell: Cell): HeaderField | undefined {
  const token = normalizeToken(cellText(cell))
  if (!token) return undefined
  const exact = HEADER_LOOKUP.get(token)
  if (exact) return exact
  for (const [alias, field] of HEADER_FUZZY) {
    if (alias.length >= 4 && token.includes(alias)) return field
  }
  return undefined
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function clockFromDate(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function cellText(cell: Cell): string {
  if (cell === null || cell === undefined) return ''
  if (cell instanceof Date) return clockFromDate(cell)
  if (typeof cell === 'boolean') return ''
  return String(cell).trim()
}

function parseDay(cell: Cell): number | null {
  if (cell instanceof Date) return (cell.getDay() + 6) % 7
  const text = cellText(cell)
  if (!text) return null
  for (const [pattern, index] of DAY_PATTERNS) {
    if (pattern.test(text)) return index
  }
  const numbered = text.match(/^(?:day\s*)?([1-7])\b/i)
  if (numbered) return Number(numbered[1]) - 1
  return null
}

function timeFromNumber(value: number): string | null {
  if (!Number.isFinite(value)) return null
  const fraction = value >= 1 ? value % 1 : value
  if (fraction < 0 || fraction >= 1) return null
  const totalMinutes = Math.round(fraction * 24 * 60) % (24 * 60)
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`
}

function parseTime(cell: Cell): string | null {
  if (cell instanceof Date) return clockFromDate(cell)
  if (typeof cell === 'number') return timeFromNumber(cell)

  let text = cellText(cell).toLowerCase()
  if (!text) return null

  text = text
    .replace(/(\d)\s*h\s*(\d{2})/g, '$1:$2')
    .replace(/(\d)\s*h(?![a-z])/g, '$1:00')
    .replace(/\.(?=\d{1,2}\b)/g, ':')
    .replace(/\s+/g, ' ')
    .trim()

  const compact = text.match(/^(\d{3,4})$/)
  if (compact) {
    const value = compact[1].padStart(4, '0')
    const hours = Number(value.slice(0, 2))
    const minutes = Number(value.slice(2))
    if (hours <= 23 && minutes <= 59) return `${pad(hours)}:${pad(minutes)}`
  }

  const match = text.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/)
  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2] ?? 0)
  const meridiem = match[3]
  if (meridiem === 'pm' && hours < 12) hours += 12
  if (meridiem === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null
  return `${pad(hours)}:${pad(minutes)}`
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = (hours * 60 + mins + minutes + 24 * 60) % (24 * 60)
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

function normalizeRange(start: string, end: string): TimeRange | null {
  if (start === end) return { start, end: addMinutes(end, 60) }
  if (end > start) return { start, end }
  const startHour = Number(start.slice(0, 2))
  const endHour = Number(end.slice(0, 2))
  if (endHour < 12 && startHour >= 12) return { start, end: addMinutes(end, 12 * 60) }
  if (startHour < 12 && endHour < 12 && startHour < endHour) return { start, end }
  return null
}

function parseRangeString(value: string): TimeRange | null {
  const match = value.match(
    /(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)\s*(?:-|–|—|to|until)\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/i,
  )
  if (!match) return null
  const start = parseTime(match[1])
  const end = parseTime(match[2])
  if (!start || !end) return null
  return normalizeRange(start, end)
}

function parseRangeCell(cell: Cell): TimeRange | null {
  if (cell instanceof Date || typeof cell === 'number') {
    const start = parseTime(cell)
    return start ? { start, end: addMinutes(start, 60) } : null
  }
  const text = cellText(cell)
  if (!text) return null
  const range = parseRangeString(text)
  if (range) return { ...range, matched: text }
  const start = parseTime(text)
  return start ? { start, end: addMinutes(start, 60), matched: text } : null
}

function extractRange(text: string): TimeRange | null {
  const match = text.match(
    /(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)\s*(?:-|–|—|to|until)\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/i,
  )
  if (!match) return null
  const start = parseTime(match[1])
  const end = parseTime(match[2])
  if (!start || !end) return null
  const range = normalizeRange(start, end)
  return range ? { ...range, matched: match[0] } : null
}

function extractCourseCode(value: string): string | null {
  const match = value.match(COURSE_CODE)
  return match ? match[1].replace(/\s+/g, ' ').trim() : null
}

function stripCourseCode(value: string, code: string): string {
  return value
    .replace(code, '')
    .replace(/^[\s\-–—:|,]+/, '')
    .replace(/[\s\-–—:|,]+$/, '')
    .trim()
}

function cleanLocation(value: string): string {
  return value
    .replace(LOCATION_PREFIX, '')
    .replace(/^[\s:–—-]+/, '')
    .replace(/[()]/g, '')
    .trim()
}

function splitCellBlocks(raw: string): string[] {
  const text = raw.replace(/\r/g, '').trim()
  if (!text) return []
  const blankSeparated = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
  if (blankSeparated.length > 1) return blankSeparated
  const semicolonSeparated = text.split(';').map((block) => block.trim()).filter(Boolean)
  if (
    semicolonSeparated.length > 1 &&
    semicolonSeparated.filter((block) => extractCourseCode(block) || extractRange(block)).length > 1
  ) {
    return semicolonSeparated
  }
  return [text]
}

function blockToLecture(
  raw: string,
  fallbackRange: TimeRange | null,
  day: number,
  row: number,
  index: number,
  fallbackLabel = '',
): { lecture?: LectureInput; issue?: TimetableIssue } {
  let text = raw.replace(/\r/g, '').trim()
  const inlineRange = extractRange(text)
  if (inlineRange?.matched) {
    text = text.replace(inlineRange.matched, ' ').replace(/\s+/g, ' ').trim()
  }
  const range = inlineRange ?? fallbackRange
  if (!range) {
    return { issue: { row, message: 'No start and end time found for this class.' } }
  }

  const lines = text
    .split(/\n|\s*[|•]\s*/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { issue: { row, message: 'Class entry has a time but no course or title.' } }
  }

  let course = ''
  let title = ''
  let location = ''

  for (const line of lines) {
    if (!course) {
      const code = extractCourseCode(line)
      if (code) {
        course = code
        const rest = stripCourseCode(line, code)
        if (rest) title = rest
        continue
      }
    }

    if (!location && (LOCATION_PREFIX.test(line) || ROOM_ONLY.test(line))) {
      location = cleanLocation(line)
      continue
    }

    if (!title) {
      title = line
      continue
    }

    if (!location) {
      location = cleanLocation(line)
      continue
    }

    title = `${title} ${line}`
  }

  const parenthetical = title.match(/\(([^)]+)\)\s*$/)
  if (parenthetical && !location && /(room|hall|lab|building|^[A-Z]{1,3}[-\s]?\d)/i.test(parenthetical[1])) {
    location = cleanLocation(parenthetical[1])
    title = title.replace(parenthetical[0], '').trim()
  }

  const fallbackCode = fallbackLabel ? extractCourseCode(fallbackLabel) : null
  if (!course && fallbackCode) course = fallbackCode
  if (!course && title) course = extractCourseCode(title) ?? ''
  if (!title && fallbackLabel) {
    title = fallbackCode ? stripCourseCode(fallbackLabel, fallbackCode) || fallbackLabel : fallbackLabel
  }
  if (!title) title = course
  if (!course) course = 'Course'
  if (!title) {
    return { issue: { row, message: 'Class entry has no course or title.' } }
  }

  return {
    lecture: {
      course,
      title,
      day,
      startTime: range.start,
      endTime: range.end,
      location,
      tone: TONES[index % TONES.length] as Tone,
    },
  }
}

function findTableHeader(rows: SheetRow[]): { headerIndex: number; map: ColumnMap } | null {
  const limit = Math.min(rows.length, 30)
  for (let index = 0; index < limit; index += 1) {
    const map: ColumnMap = {}
    rows[index].forEach((cell, column) => {
      const field = headerField(cell)
      if (field && map[field] === undefined) map[field] = column
    })
    if (
      (map.day !== undefined || map.time !== undefined) &&
      (map.course !== undefined || map.title !== undefined) &&
      (map.start !== undefined || map.end !== undefined || map.time !== undefined)
    ) {
      return { headerIndex: index, map }
    }
  }
  return null
}

function findGridHeader(rows: SheetRow[]): {
  headerIndex: number
  dayColumns: Array<{ column: number; day: number }>
} | null {
  const limit = Math.min(rows.length, 25)
  for (let index = 0; index < limit; index += 1) {
    const byDay = new Map<number, number>()
    rows[index].forEach((cell, column) => {
      const day = parseDay(cell)
      if (day !== null && !byDay.has(day)) byDay.set(day, column)
    })
    if (byDay.size >= 2) {
      return {
        headerIndex: index,
        dayColumns: Array.from(byDay, ([day, column]) => ({ day, column })).sort(
          (a, b) => a.column - b.column,
        ),
      }
    }
  }
  return null
}

function parseTable(rows: SheetRow[], headerIndex: number, map: ColumnMap): TimetableParseResult {
  const lectures: LectureInput[] = []
  const issues: TimetableIssue[] = []

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 1
    const nonEmpty = row.some((cell) => cellText(cell).length > 0)
    if (!nonEmpty) continue

    const day = map.day !== undefined
      ? parseDay(row[map.day])
      : map.time !== undefined
        ? parseDay(row[map.time])
        : null
    if (day === null) {
      issues.push({ row: rowNumber, message: 'Could not recognise the day.' })
      continue
    }

    const courseRaw = map.course !== undefined ? cellText(row[map.course]) : ''
    const titleRaw = map.title !== undefined ? cellText(row[map.title]) : ''
    const locationRaw = map.location !== undefined ? cellText(row[map.location]) : ''

    let range: TimeRange | null = null
    if (map.time !== undefined) {
      range = parseRangeCell(row[map.time])
    } else {
      const start = map.start !== undefined ? parseTime(row[map.start]) : null
      const end = map.end !== undefined ? parseTime(row[map.end]) : null
      if (start && end) range = normalizeRange(start, end)
      else if (start) range = { start, end: addMinutes(start, 60) }
    }

    if (!range) {
      issues.push({ row: rowNumber, message: 'Could not read the start and end time.' })
      continue
    }

    let course = courseRaw
    let title = titleRaw
    if (!title) title = courseRaw
    if (!course && title) course = extractCourseCode(title) ?? ''
    if (!title) title = course
    if (!course) course = 'Course'
    if (!title) {
      issues.push({ row: rowNumber, message: 'Could not read a course or lecture title.' })
      continue
    }

    lectures.push({
      course,
      title,
      day,
      startTime: range.start,
      endTime: range.end,
      location: locationRaw,
      tone: TONES[lectures.length % TONES.length] as Tone,
    })
  }

  return { lectures, issues, format: 'table' }
}

function parseGrid(
  rows: SheetRow[],
  headerIndex: number,
  dayColumns: Array<{ column: number; day: number }>,
): TimetableParseResult {
  const lectures: LectureInput[] = []
  const issues: TimetableIssue[] = []
  const firstDayColumn = Math.min(...dayColumns.map((entry) => entry.column))
  const timeColumn = firstDayColumn > 0 ? firstDayColumn - 1 : 0

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 1
    const timeRange = parseRangeCell(row[timeColumn])
    const rowText = cellText(row[timeColumn])
    const rowLabel = rowText && !timeRange ? rowText : ''

    for (const { column, day } of dayColumns) {
      const raw = cellText(row[column])
      if (!raw) continue

      const blocks = splitCellBlocks(raw)
      for (const block of blocks) {
        const result = blockToLecture(block, timeRange, day, rowNumber, lectures.length, rowLabel)
        if (result.lecture) lectures.push(result.lecture)
        if (result.issue) issues.push(result.issue)
      }
    }
  }

  return { lectures, issues, format: 'grid' }
}

function findRowGrid(rows: SheetRow[]): {
  dayColumn: number
  headerIndex: number
  timeColumns: Array<{ column: number; range: TimeRange | null }>
  dayRows: Array<{ row: number; day: number }>
} | null {
  const maxColumns = Math.max(0, ...rows.map((row) => row.length))
  for (let column = 0; column < Math.min(maxColumns, 6); column += 1) {
    const dayRows: Array<{ row: number; day: number }> = []
    rows.forEach((row, index) => {
      const day = parseDay(row[column])
      if (day !== null) dayRows.push({ row: index, day })
    })
    if (new Set(dayRows.map((entry) => entry.day)).size < 2) continue

    const firstDayRow = dayRows[0].row
    let headerIndex = -1
    let timeColumns: Array<{ column: number; range: TimeRange | null }> = []

    for (let index = firstDayRow - 1; index >= Math.max(0, firstDayRow - 8); index -= 1) {
      const ranges: Array<{ column: number; range: TimeRange | null }> = []
      for (let candidate = 0; candidate < maxColumns; candidate += 1) {
        if (candidate === column) continue
        const range = parseRangeCell(rows[index][candidate])
        if (range) ranges.push({ column: candidate, range })
      }
      if (ranges.length >= 1) {
        headerIndex = index
        timeColumns = ranges
        break
      }
    }

    if (timeColumns.length === 0) {
      timeColumns = Array.from({ length: maxColumns }, (_, candidate) => candidate)
        .filter((candidate) => candidate !== column)
        .map((candidate) => ({ column: candidate, range: null }))
    }

    return { dayColumn: column, headerIndex, timeColumns, dayRows }
  }
  return null
}

function parseRowGrid(
  rows: SheetRow[],
  grid: NonNullable<ReturnType<typeof findRowGrid>>,
): TimetableParseResult {
  const lectures: LectureInput[] = []
  const issues: TimetableIssue[] = []

  for (const entry of grid.dayRows) {
    const row = rows[entry.row]
    const rowNumber = entry.row + 1
    for (const { column, range } of grid.timeColumns) {
      const raw = cellText(row[column])
      if (!raw) continue
      const blocks = splitCellBlocks(raw)
      for (const block of blocks) {
        const result = blockToLecture(block, range, entry.day, rowNumber, lectures.length)
        if (result.lecture) lectures.push(result.lecture)
        if (result.issue) issues.push(result.issue)
      }
    }
  }

  return { lectures, issues, format: 'grid' }
}

function parseRows(rows: SheetRow[]): TimetableParseResult | null {
  const candidates: TimetableParseResult[] = []
  const tableHeader = findTableHeader(rows)
  if (tableHeader) {
    candidates.push(parseTable(rows, tableHeader.headerIndex, tableHeader.map))
  }
  const gridHeader = findGridHeader(rows)
  if (gridHeader) {
    candidates.push(parseGrid(rows, gridHeader.headerIndex, gridHeader.dayColumns))
  }
  const rowGrid = findRowGrid(rows)
  if (rowGrid) {
    candidates.push(parseRowGrid(rows, rowGrid))
  }
  if (candidates.length === 0) return null
  return candidates.sort(
    (a, b) => b.lectures.length * 10 - b.issues.length - (a.lectures.length * 10 - a.issues.length),
  )[0]
}

function parseDelimited(text: string): SheetRow[] {
  const clean = text.replace(/^\uFEFF/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ''
  const counts = [',', ';', '\t'].map((delimiter) => ({
    delimiter,
    count: firstLine.split(delimiter).length,
  }))
  const delimiter = counts.sort((a, b) => b.count - a.count)[0].delimiter

  const rows: SheetRow[] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index]
    if (quoted) {
      if (char === '"' && clean[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === delimiter) {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (cell || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

async function readSheets(file: File): Promise<Array<{ name: string; rows: SheetRow[] }>> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return [{ name: 'CSV', rows: parseDelimited(await file.text()) }]
  }
  if (name.endsWith('.xlsx')) {
    const { default: readXlsxFile } = await import('read-excel-file/universal')
    const sheets = (await readXlsxFile(file)) as Array<{ sheet: string; data: SheetRow[] }>
    return sheets.map((sheet) => ({ name: sheet.sheet, rows: sheet.data }))
  }
  throw new Error('Upload an .xlsx or .csv file. Legacy .xls files should be saved as .xlsx first.')
}

function firstNonEmptyRow(rows: SheetRow[]): SheetRow | undefined {
  return rows.find((row) => row.some((cell) => cellText(cell).length > 0))
}

export async function parseTimetableFile(file: File): Promise<TimetableParseResult> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('That file is larger than 10 MB. Try exporting just the timetable sheet.')
  }

  const sheets = await readSheets(file)
  if (!sheets.length || !sheets.some((sheet) => sheet.rows.length)) {
    throw new Error('The file is empty.')
  }

  const attempts: TimetableParseResult[] = []
  for (const sheet of sheets) {
    const result = parseRows(sheet.rows)
    if (result) attempts.push({ ...result, sheet: sheet.name })
  }

  if (attempts.length === 0) {
    const sheet = sheets.find((entry) => firstNonEmptyRow(entry.rows)) ?? sheets[0]
    const sample = firstNonEmptyRow(sheet.rows)
      ?.slice(0, 6)
      .map((cell) => cellText(cell))
      .filter(Boolean)
      .join(' | ')
    const names = sheets.map((entry) => entry.name).join(', ')
    throw new Error(
      `No timetable header found. Sheets: ${names}. First row: "${sample || 'empty'}". Expected Day/Course/Title/Start/End columns, weekday columns, or weekday rows.`,
    )
  }

  return attempts.sort(
    (a, b) => b.lectures.length * 10 - b.issues.length - (a.lectures.length * 10 - a.issues.length),
  )[0]
}
