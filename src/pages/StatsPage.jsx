
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

import { fetchWorkoutsInRange, dateKey } from '../utils/workouts'
import { fetchCondition } from '../api/coachingApi'
import { clearToken } from '../auth/token'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
)

const COLORS = {
  running: '#3577f6',
  boxing: '#ff7870',
  flame: '#c83224',
  muted: '#8c9bb3',
  grid: '#edf0f5'
}

const PERIODS = [
  { label: '1개월', value: 1 },
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 }
]

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function getStartDate(monthCount) {
  const now = new Date()

  return localDateKey(
    new Date(
      now.getFullYear(),
      now.getMonth() - monthCount + 1,
      1
    )
  )
}

function monthKey(dateString) {
  return String(dateString || '').slice(0, 7)
}

function makeMonths(monthCount) {
  const now = new Date()
  const result = []

  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    )

    result.push({
      key: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0')
      ].join('-'),
      label: `${date.getMonth() + 1}월`,
      running: 0,
      boxing: 0
    })
  }

  return result
}

function formatDuration(minutes) {
  const total = Math.round(minutes)
  const hours = Math.floor(total / 60)
  const rest = total % 60

  if (hours === 0) return `${rest}분`
  return `${hours}시간 ${rest}분`
}

// 백엔드 RPE는 1~5점 기준
// 실제 저장된 값만 통계에 반영
function readRpe(condition) {
  if (!condition || typeof condition !== 'object') {
    return null
  }

  const candidates = [
    condition.rpe,
    condition.perceivedExertion,
    condition.effortLevel,
    condition.effort
  ]

  for (const candidate of candidates) {
    if (
      candidate !== null &&
      candidate !== undefined &&
      candidate !== ''
    ) {
      const number = Number(candidate)

      if (
        Number.isFinite(number) &&
        number >= 1 &&
        number <= 5
      ) {
        return number
      }
    }
  }

  return null
}

const axisOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: COLORS.muted,
        usePointStyle: true,
        padding: 20,
        font: { size: 12 }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: COLORS.muted }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: COLORS.grid,
        drawBorder: false
      },
      ticks: {
        color: COLORS.muted,
        precision: 0
      }
    }
  }
}

function MetricCard({
  title,
  value,
  description,
  icon,
  color
}) {
  return (
    <div className="metric-card nrnl-stats-metric">
      <div className="nrnl-stats-metric-top">
        <span>{title}</span>

        <span
          className="nrnl-stats-metric-icon"
          style={{
            color,
            backgroundColor: `${color}16`
          }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <strong className="nrnl-stats-metric-value">
        {value}
      </strong>

      <p className="nrnl-stats-metric-description">
        {description}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
  className = ''
}) {
  return (
    <section
      className={`surface nrnl-stats-chart ${className}`}
    >
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p className="nrnl-stats-chart-subtitle">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  )
}

export default function StatsPage() {
  const navigate = useNavigate()

  const [period, setPeriod] = useState(6)
  const [workouts, setWorkouts] = useState([])
  const [conditions, setConditions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setConditions({})

      try {
        const items = await fetchWorkoutsInRange(
          getStartDate(period),
          localDateKey(new Date())
        )

        if (!active) return

        setWorkouts(items)

        // 운동별 컨디션 기록에서 RPE 조회
        // 개별 조회 실패는 전체 통계 오류로 처리하지 않음
        const results = await Promise.allSettled(
          items.map(workout =>
            fetchCondition(workout.id)
          )
        )

        if (!active) return

        const nextConditions = {}

        results.forEach((result, index) => {
          if (result.status !== 'fulfilled') return

          const rpe = readRpe(result.value)

          if (rpe !== null) {
            nextConditions[items[index].id] = rpe
          }
        })

        setConditions(nextConditions)
      } catch (err) {
        if (!active) return

        if (err.status === 401) {
          clearToken()
          navigate('/login', { replace: true })
          return
        }

        setError(
          err.message || '통계를 불러오지 못했습니다.'
        )
        setWorkouts([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [period, navigate])

  const stats = useMemo(() => {
    const running = workouts.filter(
      w => w.type === 'RUNNING'
    )

    const boxing = workouts.filter(
      w => w.type === 'BOXING'
    )

    const totalMinutes = workouts.reduce(
      (sum, w) =>
        sum + Number(w.durationMinutes || 0),
      0
    )

    const runningDistance = running.reduce(
      (sum, w) =>
        sum + Number(w.distanceKm || 0),
      0
    )

    const months = makeMonths(period)

    const monthMap = new Map(
      months.map(month => [
        month.key,
        month
      ])
    )

    workouts.forEach(workout => {
      const key = monthKey(
        workout.workoutDateTime
      )

      const target = monthMap.get(key)

      if (!target) return

      if (workout.type === 'RUNNING') {
        target.running += 1
      } else if (workout.type === 'BOXING') {
        target.boxing += 1
      }
    })

    const rpeEntries = workouts
      .filter(
        w => conditions[w.id] !== undefined
      )
      .map(w => ({
        date: dateKey(w.workoutDateTime),
        rpe: conditions[w.id]
      }))
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date)
      )

    const averageRpe = rpeEntries.length
      ? rpeEntries.reduce(
          (sum, item) =>
            sum + item.rpe,
          0
        ) / rpeEntries.length
      : null

    return {
      total: workouts.length,
      totalMinutes,
      runningDistance,
      runningCount: running.length,
      boxingCount: boxing.length,
      months,
      rpeEntries,
      averageRpe
    }
  }, [workouts, period, conditions])

  const labels = stats.months.map(
    m => m.label
  )

  // 운동 활동 추이
  const activityData = {
    labels,
    datasets: [
      {
        label: '러닝',
        data: stats.months.map(
          m => m.running
        ),
        borderColor: COLORS.running,
        backgroundColor: COLORS.running,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3
      },
      {
        label: '복싱',
        data: stats.months.map(
          m => m.boxing
        ),
        borderColor: COLORS.boxing,
        backgroundColor: COLORS.boxing,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3
      }
    ]
  }

  // 운동 종목 비율
  const ratioData = {
    labels: ['러닝', '복싱'],
    datasets: [
      {
        data: [
          stats.runningCount,
          stats.boxingCount
        ],
        backgroundColor: [
          COLORS.running,
          COLORS.boxing
        ],
        borderWidth: 0,
        spacing: 3,
        borderRadius: 5
      }
    ]
  }

  // 월별 운동 비교
  const comparisonData = {
    labels,
    datasets: [
      {
        label: '러닝',
        data: stats.months.map(
          m => m.running
        ),
        backgroundColor: COLORS.running,
        borderRadius: 5,
        maxBarThickness: 28
      },
      {
        label: '복싱',
        data: stats.months.map(
          m => m.boxing
        ),
        backgroundColor: COLORS.boxing,
        borderRadius: 5,
        maxBarThickness: 28
      }
    ]
  }

  // RPE 변화 그래프
  const rpeData = {
    labels: stats.rpeEntries.map(
      item =>
        item.date
          .slice(5)
          .replace('-', '.')
    ),
    datasets: [
      {
        label: 'RPE',
        data: stats.rpeEntries.map(
          item => item.rpe
        ),
        borderColor: COLORS.flame,
        backgroundColor: '#c8322418',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3
      }
    ]
  }

  const ratioTotal =
    stats.runningCount +
    stats.boxingCount

  const runningPercent = ratioTotal
    ? Math.round(
        stats.runningCount /
          ratioTotal *
          100
      )
    : 0

  const boxingPercent = ratioTotal
    ? Math.round(
        stats.boxingCount /
          ratioTotal *
          100
      )
    : 0

  return (
    <div className="nrnl-stats-page">
      {/* 페이지 제목 / 기간 선택 */}
      <div className="page-heading nrnl-stats-heading">
        <div>
          <span className="eyebrow">
            PERFORMANCE ANALYTICS
          </span>

          <h1>운동 통계</h1>

          <p>
            쌓인 기록으로 나의 운동 습관을 확인해요.
          </p>
        </div>

        <div
          className="nrnl-period-selector"
          role="group"
          aria-label="통계 조회 기간"
        >
          {PERIODS.map(item => (
            <button
              key={item.value}
              type="button"
              className={
                period === item.value
                  ? 'nrnl-period-button active'
                  : 'nrnl-period-button'
              }
              onClick={() =>
                setPeriod(item.value)
              }
              aria-pressed={
                period === item.value
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {loading && (
        <p className="nrnl-stats-loading">
          운동 통계를 불러오는 중...
        </p>
      )}

      {/* 요약 카드 4개 */}
      <div className="nrnl-stats-metric-grid">
        <MetricCard
          title="총 운동 횟수"
          value={`${stats.total.toLocaleString()}회`}
          description={`최근 ${period}개월 운동 기록`}
          icon="◎"
          color={COLORS.flame}
        />

        <MetricCard
          title="총 운동 시간"
          value={formatDuration(
            stats.totalMinutes
          )}
          description="러닝과 복싱 누적 시간"
          icon="◷"
          color="#e58b24"
        />

        <MetricCard
          title="러닝 거리"
          value={`${
            Number(
              stats.runningDistance.toFixed(2)
            )
          } km`}
          description="선택 기간 누적 거리"
          icon="↗"
          color="#149d7b"
        />

        {/* 평균 RPE: 5점 만점 */}
        <MetricCard
          title="평균 RPE"
          value={
            stats.averageRpe !== null
              ? `${stats.averageRpe.toFixed(1)} / 5`
              : '—'
          }
          description={
            stats.rpeEntries.length
              ? `컨디션 기록 ${stats.rpeEntries.length}건 기준`
              : '기록된 운동 강도 데이터 없음'
          }
          icon="♡"
          color="#9065e8"
        />
      </div>

      {/* 첫 번째 줄: 활동 추이 + 종목 비율 */}
      <div className="nrnl-stats-top-grid">
        <ChartCard
          title="운동 활동 추이"
          subtitle="월별 러닝과 복싱 횟수 변화"
        >
          <div className="nrnl-stats-chart-area">
            <Line
              data={activityData}
              options={axisOptions}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="운동 종목 비율"
          subtitle="러닝과 복싱 운동 구성"
        >
          {ratioTotal > 0 ? (
            <div className="nrnl-stats-ratio-layout">
              <div className="nrnl-stats-doughnut">
                <Doughnut
                  data={ratioData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '76%',
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />

                <div className="nrnl-stats-doughnut-center">
                  <strong>
                    {ratioTotal}
                  </strong>
                  <span>
                    총 운동 횟수
                  </span>
                </div>
              </div>

              <div className="nrnl-stats-ratio-details">
                <div className="nrnl-stats-ratio-item">
                  <div className="nrnl-stats-ratio-label">
                    <strong>러닝</strong>
                    <span>
                      {stats.runningCount}회 · {runningPercent}%
                    </span>
                  </div>

                  <div className="nrnl-stats-progress">
                    <div
                      style={{
                        width: `${runningPercent}%`,
                        background: COLORS.running
                      }}
                    />
                  </div>
                </div>

                <div className="nrnl-stats-ratio-item">
                  <div className="nrnl-stats-ratio-label">
                    <strong>복싱</strong>
                    <span>
                      {stats.boxingCount}회 · {boxingPercent}%
                    </span>
                  </div>

                  <div className="nrnl-stats-progress">
                    <div
                      style={{
                        width: `${boxingPercent}%`,
                        background: COLORS.boxing
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-mini">
              선택한 기간의 운동 기록이 없습니다.
            </div>
          )}
        </ChartCard>
      </div>

      {/* 두 번째 줄: 월별 비교 + 운동 강도 */}
      <div className="nrnl-stats-bottom-grid">
        <ChartCard
          title="월별 운동 비교"
          subtitle="종목별 월간 운동 횟수"
        >
          <div className="nrnl-stats-chart-area">
            <Bar
              data={comparisonData}
              options={axisOptions}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="운동 강도 변화"
          subtitle="운동별 체감 강도(RPE)"
        >
          {stats.rpeEntries.length ? (
            <div className="nrnl-stats-chart-area">
              <Line
                data={rpeData}
                options={{
                  ...axisOptions,
                  scales: {
                    ...axisOptions.scales,
                    y: {
                      ...axisOptions.scales.y,
                      min: 0,
                      max: 5,
                      ticks: {
                        color: COLORS.muted,
                        stepSize: 1
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="nrnl-stats-no-rpe">
              <strong>
                운동 강도 기록이 없습니다.
              </strong>

              <p>
                컨디션 기록에 RPE 데이터가 저장되면
                이곳에 운동 강도 변화가 표시됩니다.
              </p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* 통계 화면 전용 스타일 */}
      <style>{`
        .nrnl-stats-page {
          width: 100%;
        }

        .nrnl-stats-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
        }

        .nrnl-period-selector {
          display: flex;
          gap: 4px;
          padding: 5px;
          border: 1px solid #f0dfd8;
          border-radius: 13px;
          background: #fff;
        }

        .nrnl-period-button {
          border: none;
          background: transparent;
          color: #8c9bb3;
          padding: 11px 15px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .nrnl-period-button:hover {
          background: #fff2ed;
          color: #b72e20;
        }

        .nrnl-period-button.active {
          background: #b72e20;
          color: #fff;
          box-shadow: 0 3px 10px #b72e2025;
        }

        .nrnl-stats-loading {
          margin: 0 0 16px;
          color: #8c9bb3;
          font-size: 13px;
        }

        .nrnl-stats-metric-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 20px;
        }

        .nrnl-stats-metric {
          min-width: 0;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .nrnl-stats-metric-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .nrnl-stats-metric-top > span:first-child {
          font-size: 13px;
          font-weight: 700;
          color: #8c9bb3;
        }

        .nrnl-stats-metric-icon {
          width: 37px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          font-size: 23px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .nrnl-stats-metric-value {
          display: block;
          font-size: clamp(21px, 2vw, 29px);
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.3;
          color: #342525;
          white-space: nowrap;
        }

        .nrnl-stats-metric-description {
          color: #8c9bb3;
          font-size: 12px;
          margin: auto 0 0;
        }

        .nrnl-stats-top-grid,
        .nrnl-stats-bottom-grid {
          display: grid;
          gap: 20px;
          margin-bottom: 20px;
        }

        .nrnl-stats-top-grid {
          grid-template-columns: 1.15fr 0.85fr;
        }

        .nrnl-stats-bottom-grid {
          grid-template-columns: 1fr 1fr;
        }

        .nrnl-stats-chart {
          min-width: 0;
          padding: 24px;
        }

        .nrnl-stats-chart .section-heading {
          margin-bottom: 22px;
        }

        .nrnl-stats-chart-subtitle {
          margin: 6px 0 0;
          color: #8c9bb3;
          font-size: 12px;
        }

        .nrnl-stats-chart-area {
          width: 100%;
          height: 290px;
          position: relative;
        }

        .nrnl-stats-ratio-layout {
          display: grid;
          grid-template-columns: minmax(150px, 1fr) 1fr;
          align-items: center;
          gap: 25px;
          min-height: 290px;
        }

        .nrnl-stats-doughnut {
          position: relative;
          width: 100%;
          max-width: 235px;
          aspect-ratio: 1;
          margin: auto;
        }

        .nrnl-stats-doughnut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .nrnl-stats-doughnut-center strong {
          color: #342525;
          font-size: 30px;
          font-weight: 800;
        }

        .nrnl-stats-doughnut-center span {
          color: #8c9bb3;
          font-size: 11px;
        }

        .nrnl-stats-ratio-details {
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }

        .nrnl-stats-ratio-label {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 12px;
        }

        .nrnl-stats-ratio-label strong {
          color: #342525;
        }

        .nrnl-stats-ratio-label span {
          color: #8c9bb3;
          white-space: nowrap;
        }

        .nrnl-stats-progress {
          width: 100%;
          height: 8px;
          background: #edf0f5;
          border-radius: 999px;
          overflow: hidden;
        }

        .nrnl-stats-progress > div {
          height: 100%;
          border-radius: inherit;
        }

        .nrnl-stats-no-rpe {
          height: 290px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
          color: #8c9bb3;
        }

        .nrnl-stats-no-rpe strong {
          color: #342525;
          font-size: 15px;
        }

        .nrnl-stats-no-rpe p {
          font-size: 12px;
          line-height: 1.7;
          max-width: 280px;
        }

        @media (max-width: 1200px) {
          .nrnl-stats-metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .nrnl-stats-top-grid,
          .nrnl-stats-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .nrnl-stats-metric-grid {
            gap: 10px;
          }

          .nrnl-stats-metric {
            min-height: 135px;
          }

          .nrnl-stats-metric-value {
            font-size: 20px;
            white-space: normal;
          }

          .nrnl-stats-chart {
            padding: 16px;
          }

          .nrnl-stats-ratio-layout {
            grid-template-columns: 1fr;
          }

          .nrnl-stats-doughnut {
            max-width: 210px;
          }

          .nrnl-period-button {
            padding: 9px 11px;
          }
        }
      `}</style>
    </div>
  )
}
