
import { useMemo, useState } from 'react'
import { countByDate } from '../utils/workouts'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLevel(count) {
  if (count <= 0) return 0
  return Math.min(count, 4)
}

export default function WorkoutHeatmap({ workouts = [] }) {
  const [hovered, setHovered] = useState(null)

  const counts = useMemo(
    () => countByDate(workouts),
    [workouts]
  )

  const { weeks, monthLabels } = useMemo(() => {
    const year = new Date().getFullYear()
    const start = new Date(year, 0, 1, 12)
    const end = new Date(year, 11, 31, 12)

    // 1월 1일이 속한 주의 일요일부터 칸을 정렬
    const gridStart = new Date(start)
    gridStart.setDate(
      gridStart.getDate() - gridStart.getDay()
    )

    const result = []
    let currentWeek = []

    for (
      const date = new Date(gridStart);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const current = new Date(date)
      const key = toDateKey(current)

      // 해당 연도 밖의 날짜는 빈칸으로 처리
      const isOutsideYear =
        current.getFullYear() !== year

      currentWeek.push(
        isOutsideYear
          ? null
          : {
              key,
              date: current,
              count: counts[key] || 0,
              level: getLevel(counts[key] || 0)
            }
      )

      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    }

    // 마지막 주의 남은 요일 채우기
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }

      result.push(currentWeek)
    }

    // 1월부터 12월까지 월별 시작 위치 계산
    const labels = Array.from(
      { length: 12 },
      (_, month) => {
        const firstDay = new Date(year, month, 1, 12)

        const diffDays = Math.round(
          (firstDay - gridStart) / 86400000
        )

        return {
          month: month + 1,
          weekIndex: Math.floor(diffDays / 7)
        }
      }
    )

    return {
      weeks: result,
      monthLabels: labels
    }
  }, [counts])

  function tooltipText(cell) {
    const date = cell.date

    return {
      date: `${date.getFullYear()}년 ${
        date.getMonth() + 1
      }월 ${date.getDate()}일 (${
        WEEKDAYS[date.getDay()]
      })`,
      count: `운동 ${cell.count}회`
    }
  }

  return (
    <div className="heatmap-wrapper">
      <div className="flame-heatmap-scroll">
        <div
          className="flame-heatmap-content"
          style={{
            '--heatmap-weeks': weeks.length
          }}
        >
          <div className="flame-heatmap-months">
            {monthLabels.map(label => (
              <span
                key={label.month}
                className="flame-heatmap-month"
                style={{
                  gridColumn: label.weekIndex + 1
                }}
              >
                {label.month}월
              </span>
            ))}
          </div>

          <div className="flame-heatmap-body">
            <div className="flame-heatmap-weekdays">
              <span />
              <span>월</span>
              <span />
              <span>수</span>
              <span />
              <span>금</span>
              <span />
            </div>

            <div className="flame-heatmap-grid">
              {weeks.map((week, weekIndex) => (
                <div
                  className="flame-heatmap-week"
                  key={weekIndex}
                >
                  {week.map((cell, dayIndex) => {
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${dayIndex}`}
                          className="flame-heatmap-empty"
                        />
                      )
                    }

                    const isHovered =
                      hovered === cell.key

                    const tooltip = tooltipText(cell)

                    return (
                      <div
                        key={cell.key}
                        className={
                          `flame-heatmap-cell level-${cell.level}`
                        }
                        tabIndex={0}
                        role="img"
                        aria-label={
                          `${tooltip.date}, ${tooltip.count}`
                        }
                        onMouseEnter={() =>
                          setHovered(cell.key)
                        }
                        onMouseLeave={() =>
                          setHovered(null)
                        }
                        onFocus={() =>
                          setHovered(cell.key)
                        }
                        onBlur={() =>
                          setHovered(null)
                        }
                      >
                        {isHovered && (
                          <div className="flame-heatmap-tooltip">
                            <strong>
                              {tooltip.date}
                            </strong>

                            <span>
                              {tooltip.count}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flame-heatmap-legend">
        <span>적게</span>

        {[0, 1, 2, 3, 4].map(level => (
          <i
            key={level}
            className={
              `flame-heatmap-cell level-${level}`
            }
          />
        ))}

        <span>많이</span>
      </div>
    </div>
  )
}
