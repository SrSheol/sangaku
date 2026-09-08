import {
  URGENCY_BUCKET_GLYPHS,
  URGENCY_BUCKET_HINTS,
  URGENCY_BUCKET_LABELS,
} from '../../lib/constants'
import { groupByUrgency, URGENCY_BUCKET_ORDER, type UrgencyBucketKey } from '../../lib/tasks'
import type { Task, TaskStatus } from '../../types'
import { TaskCard } from '../ui/TaskCard'

const DEFAULT_OPEN: Record<UrgencyBucketKey, boolean> = {
  overdue: true,
  today: true,
  week: true,
  later: false,
  closed: false,
}

export function UrgencyBoard({
  tasks,
  readOnly,
  density,
  onStatus,
  onDone,
  onOpen,
}: {
  tasks: Task[]
  readOnly?: boolean
  density: 'comfortable' | 'compact'
  onStatus: (id: string, s: TaskStatus) => void
  onDone: (id: string) => void
  onOpen: (task: Task) => void
}) {
  const buckets = groupByUrgency(tasks)

  return (
    <div className="temple-board">
      {URGENCY_BUCKET_ORDER.map((key) => {
        const items = buckets[key]
        if (items.length === 0) return null
        return (
          <details
            key={key}
            className={`temple-section temple-${key} reveal-section`}
            open={DEFAULT_OPEN[key]}
          >
            <summary className="temple-summary">
              <span className="temple-glyph" aria-hidden>
                {URGENCY_BUCKET_GLYPHS[key]}
              </span>
              <span className="temple-heading">
                <span className="temple-label">{URGENCY_BUCKET_LABELS[key]}</span>
                <span className="temple-hint">{URGENCY_BUCKET_HINTS[key]}</span>
              </span>
              <span className="count">{items.length}</span>
              <span className="temple-chevron" aria-hidden>
                開
              </span>
            </summary>
            <div className="card-list">
              {items.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={idx}
                  readOnly={readOnly}
                  density={density}
                  dueSoonBadge
                  onStatus={(s) => onStatus(task.id, s)}
                  onDone={() => onDone(task.id)}
                  onOpen={() => onOpen(task)}
                />
              ))}
            </div>
          </details>
        )
      })}
    </div>
  )
}
