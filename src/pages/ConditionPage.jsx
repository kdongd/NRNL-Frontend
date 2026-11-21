
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchCondition, saveCondition } from '../api/coachingApi'
import { clearToken } from '../auth/token'
import '../styles/workout-form.css'

const BODY_PARTS = [
  ['NECK', '목'],
  ['SHOULDER', '어깨'],
  ['ELBOW', '팔꿈치'],
  ['WRIST_HAND', '손목/손'],
  ['LOWER_BACK', '허리'],
  ['HIP', '고관절'],
  ['THIGH', '허벅지'],
  ['KNEE', '무릎'],
  ['CALF_SHIN', '종아리/정강이'],
  ['ANKLE', '발목'],
  ['FOOT', '발'],
  ['OTHER', '기타']
]

function ScoreInput({ title, description, value, onChange, labels }) {
  return (
    <section className="nrnl-workout-panel">
      <div className="nrnl-workout-section-heading">
        <h2>{title}</h2>
      </div>

      <p className="nrnl-workout-hint">{description}</p>

      <div className="nrnl-workout-rpe-grid">
        {labels.map((label, index) => {
          const score = index + 1
          return (
            <button
              key={score}
              type="button"
              aria-pressed={value === score}
              className={`nrnl-workout-rpe-card ${value === score ? 'is-active' : ''}`}
              onClick={() => onChange(score)}
            >
              <strong>{score}</strong>
              <small>{label}</small>
            </button>
          )
        })}
      </div>

      <p className="nrnl-workout-rpe-description">{value} / 5</p>
    </section>
  )
}

export default function ConditionPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [rpe, setRpe] = useState(3)
  const [bodyCondition, setBodyCondition] = useState(3)
  const [hasPain, setHasPain] = useState(false)
  const [pains, setPains] = useState({})
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await fetchCondition(id)
        if (!active) return

        setRpe(data.rpe)
        setBodyCondition(data.bodyCondition)

        const painMap = Object.fromEntries(
          (data.pains ?? []).map(p => [p.bodyPart, p.intensity])
        )

        setPains(painMap)
        setHasPain(Object.keys(painMap).length > 0)
        setMemo(data.memo ?? '')
      } catch (e) {
        if (!active) return

        if (e.status === 401) {
          clearToken()
          navigate('/login', { replace: true })
        } else if (e.status !== 404) {
          setError(e.message || '컨디션을 불러오지 못했습니다.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [id, navigate])

  function togglePain(part) {
    setPains(prev => {
      const next = { ...prev }
      if (next[part]) delete next[part]
      else next[part] = 1
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return

    if (hasPain && Object.keys(pains).length === 0) {
      setError('통증이 있다면 통증 부위를 하나 이상 선택해주세요.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await saveCondition(id, {
        rpe,
        bodyCondition,
        pains: hasPain
          ? Object.entries(pains).map(([bodyPart, intensity]) => ({
              bodyPart,
              intensity: Number(intensity)
            }))
          : [],
        memo: memo.trim() || null
      })

      setSuccess('컨디션이 업데이트되었습니다. 변경 내용은 AI 코칭에 반영됩니다.')
    } catch (e) {
      if (e.status === 401) {
        clearToken()
        navigate('/login', { replace: true })
      } else {
        setError(e.message || '컨디션 업데이트에 실패했습니다.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="nrnl-workout-page">컨디션 불러오는 중...</div>
  }

  return (
    <div className="nrnl-workout-page">
      <div className="nrnl-workout-heading">
        <div>
          <span className="nrnl-workout-eyebrow">CONDITION UPDATE</span>
          <h1>컨디션 업데이트</h1>
          <p>운동 이후 달라진 몸 상태를 기록해주세요.</p>
        </div>
        <Link to={`/workouts/${id}`} className="nrnl-workout-back">
          ← 운동 상세로
        </Link>
      </div>

      <div className="nrnl-condition-update-hint">
        <strong>운동 당시와 지금의 몸 상태가 달라졌나요?</strong>
        <p>
          운동 다음 날 통증이 심해지거나 피로가 남아 있다면
          기존 컨디션 기록을 수정해주세요.
          변경된 정보는 이후 AI 코칭에 반영됩니다.
        </p>
        <small>
          ※ 새로운 컨디션 이력을 추가하는 것이 아니라 기존 기록을 수정합니다.
        </small>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: 18,
          maxWidth: 850,
          margin: '0 auto'
        }}
      >
        {error && (
          <div className="nrnl-workout-alert" role="alert">{error}</div>
        )}

        {success && (
          <div className="nrnl-workout-panel" role="status">
            <p>{success}</p>
            <Link to="/coaching">AI 코칭 보러가기 →</Link>
          </div>
        )}

        <ScoreInput
          title="운동 체감 강도 (RPE)"
          description="운동 당시 느꼈던 강도를 선택해주세요."
          labels={['매우 쉬움', '쉬움', '보통', '힘듦', '매우 힘듦']}
          value={rpe}
          onChange={setRpe}
        />

        <ScoreInput
          title="몸 상태"
          description="현재 확인한 몸 상태를 반영해주세요."
          labels={['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음']}
          value={bodyCondition}
          onChange={setBodyCondition}
        />

        <section className="nrnl-workout-panel">
          <div className="nrnl-workout-section-heading">
            <h2>통증 기록</h2>
          </div>

          <p className="nrnl-workout-hint">
            운동 후 새롭게 느껴진 통증이나 달라진 통증 강도를 반영해주세요.
          </p>

          <div className="nrnl-workout-pain-choice">
            <button
              type="button"
              className={!hasPain ? 'is-active' : ''}
              aria-pressed={!hasPain}
              onClick={() => {
                setHasPain(false)
                setPains({})
              }}
            >
              통증 없음
            </button>
            <button
              type="button"
              className={hasPain ? 'is-active' : ''}
              aria-pressed={hasPain}
              onClick={() => setHasPain(true)}
            >
              통증 있음
            </button>
          </div>

          {hasPain && (
            <>
              <div className="nrnl-workout-pain-grid">
                {BODY_PARTS.map(([part, label]) => (
                  <button
                    key={part}
                    type="button"
                    aria-pressed={!!pains[part]}
                    className={`nrnl-workout-pain-part ${pains[part] ? 'is-active' : ''}`}
                    onClick={() => togglePain(part)}
                  >
                    {pains[part] ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>

              {BODY_PARTS.filter(([part]) => pains[part]).map(([part, label]) => (
                <div key={part} className="nrnl-workout-pain-level">
                  <div className="nrnl-workout-pain-title">
                    <strong>{label}</strong>
                    <span>{pains[part]} / 5</span>
                  </div>

                  <div className="nrnl-workout-pain-buttons">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        type="button"
                        aria-pressed={pains[part] === score}
                        className={pains[part] === score ? 'is-active' : ''}
                        onClick={() => setPains(prev => ({
                          ...prev,
                          [part]: score
                        }))}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="nrnl-workout-panel">
          <div className="nrnl-workout-section-heading">
            <h2>컨디션 메모</h2>
          </div>

          <div className="nrnl-workout-field">
            <textarea
              rows={4}
              maxLength={255}
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="예: 운동 다음 날 일어나니 무릎 통증이 더 심해졌음"
            />
            <p className="nrnl-workout-char-count">{memo.length} / 255자</p>
          </div>
        </section>

        <div className="nrnl-workout-footer">
          <button
            type="submit"
            className="nrnl-workout-save-button"
            disabled={saving}
          >
            {saving ? '업데이트 중...' : '컨디션 업데이트하기'}
          </button>

          <Link
            to={`/workouts/${id}`}
            className="nrnl-workout-cancel-button"
          >
            운동 상세로 돌아가기
          </Link>
        </div>
      </form>
    </div>
  )
}
