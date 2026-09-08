import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORY_LABELS } from '../../lib/constants'
import type { Task, TaskCategory, TaskStatus } from '../../types'
import { TaskCard } from '../ui/TaskCard'

export function ListView({
  completed,
  activeGroups,
  groupByCategory,
  showCompletedSection,
  showActiveSection,
  readOnly,
  density,
  onStatus,
  onDone,
  onOpen,
}: {
  completed: Task[]
  activeGroups: { category: string; tasks: Task[] }[]
  groupByCategory: boolean
  showCompletedSection: boolean
  showActiveSection: boolean
  readOnly?: boolean
  density: 'comfortable' | 'compact'
  onStatus: (id: string, s: TaskStatus) => void
  onDone: (id: string) => void
  onOpen: (task: Task) => void
}) {
  return (
    <AnimatePresence mode="wait">
      {showCompletedSection && completed.length > 0 && (
        <motion.section
          key="completed"
          className="category-block section-completed reveal-section"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <h2 className="category-title section-divider">
            <span className="hairline" />
            Completadas
            <span className="count">{completed.length}</span>
          </h2>
          <div className="card-list">
            {completed.map((task, idx) => (
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
        </motion.section>
      )}

      {showActiveSection && (
        <motion.section
          key="active-wrap"
          className="category-block reveal-section"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {showCompletedSection && completed.length > 0 && (
            <h2 className="category-title section-divider">
              <span className="hairline" />
              Activas
              <span className="count">
                {activeGroups.reduce((n, g) => n + g.tasks.length, 0)}
              </span>
            </h2>
          )}
          {activeGroups.map((g) => (
            <div key={g.category} className="category-sub">
              {groupByCategory && g.category !== 'all' && (
                <h3 className="category-title nested">
                  <span className="hairline" />
                  {CATEGORY_LABELS[g.category as TaskCategory] ?? g.category}
                  <span className="count">{g.tasks.length}</span>
                </h3>
              )}
              <div className="card-list">
                {g.tasks.map((task, idx) => (
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
            </div>
          ))}
        </motion.section>
      )}
    </AnimatePresence>
  )
}
