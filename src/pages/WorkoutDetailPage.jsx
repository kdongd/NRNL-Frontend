
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchWorkoutById, deleteWorkout } from '../api/workoutApi'
import { clearToken } from '../auth/token'
import '../styles/workout-form.css'

const TRAINING_LABELS = {
  SHADOW: '섀도우',
  MITT: '미트',
  SPARRING: '스파링'
}

function formatDateTime(value) {
  if (!value) return '-'
  const [date, time = ''] = value.split('T')
  return `${date.replaceAll('-', '.')} ${time.slice(0, 5)}`
}

export default function WorkoutDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [workout, setWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetchWorkoutById(id)
      .then(data => {
        if (active) setWorkout(data)
      })
      .catch(e => {
        if (!active) return

        if (e.status === 401) {
          clearToken()
          navigate('/login', { replace: true })
        } else {
          setError('운동 상세 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [id, navigate])

  async function handleDelete() {
    if (!window.confirm('이 운동 기록을 삭제하시겠습니까?')) return

    try {
      const response = await deleteWorkout(id)

      if (response.status === 401) {
        clearToken()
        navigate('/login', { replace: true })
        return
      }

      if (!response.ok) {
        throw new Error('운동 기록 삭제에 실패했습니다.')
      }

      navigate('/calendar')
    } catch (e) {
      setError(e.message || '삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return <div className="detail-page">운동 기록 불러오는 중...</div>
  }

  if (error || !workout) {
    return (
      <div className="detail-page">
        <div className="detail-card">
          <p>{error || '운동 기록을 찾을 수 없습니다.'}</p>
          <Link to="/calendar" className="sub-btn">운동 관리로</Link>
        </div>
      </div>
    )
  }

  const isRunning = workout.type === 'RUNNING'

  return (
    <div className="detail-page">
      <div className="detail-card">
        <div className="modal-header" style={{
          padding: 0,
          marginBottom: 20,
          border: 'none'
        }}>
          <div className="type-box">
            <span className={`icon ${isRunning ? 'running' : 'boxing'}`}>
              {isRunning ? '🏃' : '🥊'}
            </span>
            {isRunning ? '러닝' : '복싱'}
          </div>
        </div>

        <div className="modal-summary">
          <span>{workout.durationMinutes}분</span>
          <span>{formatDateTime(workout.workoutDateTime)}</span>
        </div>

        {workout.memo && (
          <div className="modal-memo">{workout.memo}</div>
        )}

        {isRunning ? (
          <div className="field-group">
            <div className="detail-section-title">러닝 정보</div>
            <div className="detail-item">
              {workout.distanceKm != null && (
                <div>거리: {workout.distanceKm}km</div>
              )}
              {workout.place && <div>장소: {workout.place}</div>}
              {workout.caloriesBurned != null && (
                <div>소모 칼로리: {workout.caloriesBurned}kcal</div>
              )}
            </div>
          </div>
        ) : (
          <div className="field-group">
            <div className="detail-section-title">복싱 정보</div>
            <div className="detail-item">
              {workout.rounds != null && (
                <div>라운드: {workout.rounds}</div>
              )}
              {workout.sparringPartner && (
                <div>스파링 파트너: {workout.sparringPartner}</div>
              )}
              {workout.techniqueType && (
                <div>
                  훈련 타입: {
                    TRAINING_LABELS[workout.techniqueType] ??
                    workout.techniqueType
                  }
                </div>
              )}
            </div>
          </div>
        )}

        <div className="detail-section-title">세부 기록</div>

        <div className="detail-list">
          {workout.details?.length > 0 ? (
            workout.details.map((detail, index) => (
              <div
                className="detail-item"
                key={detail.id ?? detail.sequence ?? index}
              >
                <div className="detail-item-header">
                  <span className="detail-label">
                    {detail.label || `기록 ${index + 1}`}
                  </span>
                  {detail.durationSeconds != null && (
                    <span className="detail-seconds">
                      {detail.durationSeconds}초
                    </span>
                  )}
                </div>

                {detail.note && (
                  <div className="detail-note">{detail.note}</div>
                )}
              </div>
            ))
          ) : (
            <div className="detail-empty">
              등록된 세부 기록이 없습니다.
            </div>
          )}
        </div>

        <div className="nrnl-condition-update-hint">
          <strong>운동 이후 몸 상태가 달라졌나요?</strong>
          <p>
            운동 다음 날 통증이 더 심해지거나 피로가 남아 있다면
            컨디션을 업데이트해주세요.
            변경된 정보는 AI 코칭에 반영됩니다.
          </p>
        </div>

        <div className="detail-actions">
          <Link
            to={`/workouts/${workout.id}/condition`}
            className="main-btn"
          >
            컨디션 업데이트
          </Link>

          <Link
            to={`/workouts/${workout.id}/edit`}
            className="sub-btn"
          >
            수정
          </Link>

          <button
            type="button"
            className="danger-btn"
            onClick={handleDelete}
          >
            삭제
          </button>

          <Link to="/calendar" className="sub-btn">
            목록으로
          </Link>
        </div>
      </div>
    </div>
  )
}
