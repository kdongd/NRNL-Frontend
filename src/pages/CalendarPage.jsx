
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import WorkoutCalendar from '../components/WorkoutCalendar'
import WorkoutListPage from './WorkoutListPage'

import {
    dateKey,
    fetchWorkoutsInRange,
    monthBounds,
    todayKey,
    workoutLabel
} from '../utils/workouts'

import { clearToken, isLoggedIn } from '../auth/token'

export default function CalendarPage() {
    const now = new Date()
    const signedIn = isLoggedIn()

    const [view, setView] = useState({
        year: now.getFullYear(),
        month: now.getMonth()
    })

    const [selected, setSelected] = useState(todayKey())
    const [workouts, setWorkouts] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    const navigate = useNavigate()

    useEffect(() => {
        if (!signedIn) return
        let active = true

        const { from, to } = monthBounds(
            view.year,
            view.month
        )

        setLoading(true)
        setError('')

        fetchWorkoutsInRange(from, to)
            .then(items => {
                if (active) {
                    setWorkouts(items)
                }
            })
            .catch(err => {
                if (!active) return

                if (err.status === 401) {
                    clearToken()
                    navigate('/login', { replace: true })
                } else {
                    setError(err.message)
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [view, navigate, signedIn])

    function moveMonth(amount) {
        setView(v => {
            const date = new Date(
                v.year,
                v.month + amount,
                1
            )

            const next = {
                year: date.getFullYear(),
                month: date.getMonth()
            }

            setSelected(
                `${next.year}-${String(
                    next.month + 1
                ).padStart(2, '0')}-01`
            )

            return next
        })
    }

    const selectedItems = (signedIn ? workouts : []).filter(
        w => dateKey(w.workoutDateTime) === selected
    )

    return (
        <div>
            {/* 페이지 제목 */}
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        WORKOUT MANAGEMENT
                    </span>

                    <h1>운동 관리</h1>

                    <p>
                        캘린더에서 날짜별 운동을 확인하고
                        전체 운동 기록을 관리하세요.
                    </p>
                </div>
            </div>

            {error && (
                <div className="alert-error">
                    {error}
                </div>
            )}

            {/* 기존 운동 캘린더 */}
            <div className="calendar-page-grid">
                <section className="surface">
                    <WorkoutCalendar
                        {...view}
                        workouts={signedIn ? workouts : []}
                        selected={selected}
                        onSelect={setSelected}
                        onMove={moveMonth}
                    />
                </section>

                {/* 선택한 날짜의 운동 기록 */}
                <aside className="surface selected-panel">
                    <span className="eyebrow">
                        SELECTED DATE
                    </span>

                    <h2>
                        {selected.replaceAll('-', '.')}
                    </h2>

                    <p className="muted">
                        {!signedIn ? '로그인하면 날짜별 운동 기록을 볼 수 있어요.' : loading
                            ? '불러오는 중...'
                            : `${selectedItems.length}개의 운동 기록`}
                    </p>

                    {selectedItems.map(w => (
                        <Link
                            key={w.id}
                            to={`/workouts/${w.id}`}
                            className="calendar-record"
                        >
                            <span
                                className={`workout-symbol ${
                                    w.type === 'RUNNING'
                                        ? 'run-symbol'
                                        : 'box-symbol'
                                }`}
                            >
                                {w.type === 'RUNNING'
                                    ? '🏃'
                                    : '🥊'}
                            </span>

                            <span>
                                <strong>
                                    {workoutLabel(w.type)}
                                </strong>

                                <small>
                                    {w.durationMinutes}분
                                    {w.type === 'RUNNING' &&
                                    w.distanceKm
                                        ? ` · ${w.distanceKm}km`
                                        : ''}
                                </small>
                            </span>

                            <span className="push-right">
                                →
                            </span>
                        </Link>
                    ))}

                    {signedIn && !loading && !selectedItems.length && (
                        <div className="empty-mini">
                            아직 이 날짜의 운동 기록이 없어요.
                        </div>
                    )}

                    {/* 날짜별 운동 추가는 유지 */}
                    <Link
                        to={`/workouts/new?date=${selected}`}
                        className="btn btn-outline full-width"
                    >
                        이 날짜에 운동 추가
                    </Link>
                </aside>
            </div>

            {/* 캘린더 아래 전체 운동 기록 목록 */}
            {signedIn && <div style={{ marginTop: 24 }}>
                <WorkoutListPage embedded />
            </div>}
        </div>
    )
}
