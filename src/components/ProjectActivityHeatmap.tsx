import { useMemo, useState } from 'react'
import timelineData from '../../content/project-timeline.json'

type TimelineProject = {
  projectId: string
  projectName: string
  description: string | null
  months: string[]
  color: 'green'
}
type CalendarDay = { date: string; month: string }

const projects = timelineData.projects as TimelineProject[]
const dateKey = (date: Date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
const monthKey = (date: Date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0')

const monthTitle = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function buildCalendar() {
  const today = new Date()
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const start = new Date(end.getFullYear(), end.getMonth() - 11, 1)
  start.setDate(start.getDate() - start.getDay())
  const gridEnd = new Date(end)
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()))
  const weeks: CalendarDay[][] = []
  const cursor = new Date(start)
  while (cursor <= gridEnd) {
    const week: CalendarDay[] = []
    for (let day = 0; day < 7; day += 1) {
      week.push({ date: dateKey(cursor), month: monthKey(cursor) })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  const monthLabels: { key: string; label: string; column: number }[] = []
  weeks.forEach((week, column) => {
    const month = week.find((day) => day.date.slice(-2) === '01')
    if (month) monthLabels.push({ key: month.month, label: monthTitle(month.month).split(' ')[0], column: column + 2 })
  })
  return { weeks, monthLabels, today: dateKey(end) }
}

const calendar = buildCalendar()
const projectsByMonth = new Map<string, TimelineProject[]>()
for (const project of projects) {
  for (const month of project.months) {
    projectsByMonth.set(month, [...(projectsByMonth.get(month) ?? []), project])
  }
}

export function ProjectActivityHeatmap() {
  const [activeMonth, setActiveMonth] = useState<string | null>(null)
  const { weeks, monthLabels, today } = useMemo(() => calendar, [])
  const activeProjects = activeMonth ? projectsByMonth.get(activeMonth) ?? [] : []
  const confirmedMonthCount = projectsByMonth.size

  return <div className="project-timeline" aria-labelledby="project-timeline-heading">
    <div className="project-timeline-heading"><div><span className="section-kicker">A MANUALLY CURATED PROJECT TIMELINE</span><h3 id="project-timeline-heading">Project activity</h3><p>A local calendar of project months, maintained in portfolio data.</p></div></div>
    <div className="project-heatmap-scroll" aria-label="Scrollable project activity calendar">
      <div className="project-heatmap" style={{ '--project-week-count': weeks.length } as React.CSSProperties}>
        <div className="project-heatmap-months" aria-hidden="true"><span />{monthLabels.map((month) => <span key={month.key} style={{ gridColumn: month.column }}>{month.label}</span>)}</div>
        <div className="project-heatmap-weeks">
          <div className="project-heatmap-weekdays" aria-hidden="true"><span>Sun</span><span /><span>Tue</span><span /><span>Thu</span><span /><span>Sat</span></div>
          {weeks.map((week) => <div className="project-heatmap-week" role="group" aria-label={`Week of ${week[0].date}`} key={week[0].date}>
            {week.map((day) => {
              const monthProjects = projectsByMonth.get(day.month) ?? []
              const available = day.date <= today && monthProjects.length > 0
              const label = monthTitle(day.month) + (available ? `: project activity includes ${monthProjects.map((item) => item.projectName).join(', ')}` : ': no configured project activity')
              return available
                ? <button type="button" className="project-heatmap-day" key={day.date} aria-label={label} aria-pressed={activeMonth === day.month} title={label} onPointerEnter={(event) => event.pointerType !== 'touch' && setActiveMonth(day.month)} onFocus={() => setActiveMonth(day.month)} onClick={() => setActiveMonth((current) => current === day.month ? null : day.month)} />
                : <span className="project-heatmap-day" key={day.date} aria-label={label} title={label} />
            })}
          </div>)}
        </div>
      </div>
    </div>
    <div className="project-heatmap-legend" aria-label="Calendar legend"><span>No project</span><i className="project-heatmap-day" /><span>Project-active month</span><small>Each green date cell marks the same confirmed project month; it is not a daily activity record.</small></div>
    {activeMonth && <aside className="project-heatmap-detail" role="status" aria-live="polite">
      <div><strong>{monthTitle(activeMonth)}</strong><button type="button" onClick={() => setActiveMonth(null)} aria-label="Close project month details">×</button></div>
      {activeProjects.map((project) => <article key={project.projectId}><h4>{project.projectName}</h4><p>{project.description ?? 'Description not included in the local repository data.'}</p></article>)}
    </aside>}
    {!confirmedMonthCount && <p className="project-heatmap-note">No project months are confirmed in the current source files. Add a verified YYYY-MM month to a project in content/project-timeline.json to mark it here.</p>}
  </div>
}
