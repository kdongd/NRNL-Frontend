
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  fetchWorkoutById,
  createWorkout,
  updateWorkout
} from '../api/workoutApi'
import {
  fetchCondition,
  saveCondition
} from '../api/coachingApi'
import { clearToken } from '../auth/token'
import '../styles/workout-form.css'

const RPE_LABELS = [
  '매우 쉬움', '쉬움', '보통', '힘듦', '매우 힘듦'
]

const CONDITION_LABELS = [
  '매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'
]

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

const TECHNIQUES = [
  ['SHADOW', '섀도우'],
  ['MITT', '미트'],
  ['SPARRING', '스파링']
]

function today() {
  const d = new Date()

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-')
}

function nowTime() {
  const d = new Date()

  return [
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0')
  ].join(':')
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    return false
  }

  const [y, m, d] = value.split('-').map(Number)
  const parsed = new Date(y, m - 1, d)

  return parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
}

function ScoreCard({
  number,
  title,
  description,
  labels,
  value,
  onChange
}) {
  return (
    <section className="nrnl-workout-panel">
      <div className="nrnl-workout-section-heading">
        <span className="nrnl-workout-section-number">
          {number}
        </span>
        <h2>{title}</h2>
      </div>

      <p className="nrnl-workout-hint">
        {description}
      </p>

      <div className="nrnl-workout-rpe-grid">
        {labels.map((label, index) => {
          const score = index + 1

          return (
            <button
              key={score}
              type="button"
              aria-pressed={value === score}
              className={
                `nrnl-workout-rpe-card ${
                  value === score ? 'is-active' : ''
                }`
              }
              onClick={() => onChange(score)}
            >
              <strong>{score}</strong>
              <small>{label}</small>
            </button>
          )
        })}
      </div>

      <p className="nrnl-workout-rpe-description">
        {value} / 5
      </p>
    </section>
  )
}

export default function WorkoutFormPage({ mode = 'create' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const isEdit = mode === 'edit'
  const selectedDate = params.get('date')

  const [type, setType] = useState('RUNNING')
  const [workoutDate, setWorkoutDate] = useState(
    validDate(selectedDate) ? selectedDate : today()
  )
  const [workoutTime, setWorkoutTime] = useState(nowTime)
  const [duration, setDuration] = useState('')

  const [distanceKm, setDistanceKm] = useState('')
  const [place, setPlace] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')

  const [rounds, setRounds] = useState('')
  const [sparringPartner, setSparringPartner] = useState('')
  const [techniqueType, setTechniqueType] = useState('SHADOW')

  const [memo, setMemo] = useState('')
  const [details, setDetails] = useState([])

  const [rpe, setRpe] = useState(3)
  const [bodyCondition, setBodyCondition] = useState(3)
  const [hasPain, setHasPain] = useState(false)
  const [pains, setPains] = useState({})
  const [conditionMemo, setConditionMemo] = useState('')

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedWorkoutId, setSavedWorkoutId] = useState(null)

  useEffect(() => {
    if (!isEdit) {
      setWorkoutDate(
        validDate(selectedDate) ? selectedDate : today()
      )
    }
  }, [selectedDate, isEdit])

  useEffect(() => {
    if (!isEdit || !id) return

    let active = true

    async function load() {
      try {
        const w = await fetchWorkoutById(id)

        if (!active) return

        setType(w.type)
        setWorkoutDate(w.workoutDateTime.slice(0, 10))
        setWorkoutTime(w.workoutDateTime.slice(11, 16))
        setDuration(String(w.durationMinutes ?? ''))

        setDistanceKm(String(w.distanceKm ?? ''))
        setPlace(w.place ?? '')
        setCaloriesBurned(String(w.caloriesBurned ?? ''))

        setRounds(String(w.rounds ?? ''))
        setSparringPartner(w.sparringPartner ?? '')
        setTechniqueType(w.techniqueType ?? 'SHADOW')

        setMemo(w.memo ?? '')

        setDetails(
          (w.details ?? []).map((d, i) => ({
            key: i + 1,
            label: d.label ?? '',
            durationSeconds: String(
              d.durationSeconds ?? ''
            ),
            note: d.note ?? ''
          }))
        )

        try {
          const c = await fetchCondition(id)

          if (!active) return

          setRpe(c.rpe)
          setBodyCondition(c.bodyCondition)

          const painMap = Object.fromEntries(
            (c.pains ?? []).map(p => [
              p.bodyPart,
              p.intensity
            ])
          )

          setPains(painMap)
          setHasPain(Object.keys(painMap).length > 0)
          setConditionMemo(c.memo ?? '')
        } catch (e) {
          if (e.status !== 404) {
            throw e
          }
        }
      } catch (e) {
        if (!active) return

        if (e.status === 401) {
          clearToken()
          navigate('/login', { replace: true })
        } else {
          setError(
            e.message || '운동 기록을 불러오지 못했습니다.'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [id, isEdit, navigate])

  function togglePain(part) {
    setPains(prev => {
      const next = { ...prev }

      if (next[part]) {
        delete next[part]
      } else {
        next[part] = 1
      }

      return next
    })
  }

  function changeDetail(key, field, value) {
    setDetails(prev =>
      prev.map(d =>
        d.key === key
          ? { ...d, [field]: value }
          : d
      )
    )
  }

  function addDetail() {
    setDetails(prev => [
      ...prev,
      {
        key: Math.max(
          0,
          ...prev.map(d => d.key)
        ) + 1,
        label: '',
        durationSeconds: '',
        note: ''
      }
    ])
  }

  function workoutPayload() {
    const data = {
      type,
      durationMinutes: Number(duration),
      workoutDateTime:
        `${workoutDate}T${workoutTime}:00`,
      memo: memo.trim() || null,
      details: details.map((d, i) => ({
        sequence: i + 1,
        label: d.label.trim(),
        durationSeconds: Number(
          d.durationSeconds
        ),
        note: d.note.trim() || null
      }))
    }

    if (type === 'RUNNING') {
      data.distanceKm = Number(distanceKm)
      data.place = place.trim() || null
      data.caloriesBurned = caloriesBurned
        ? Number(caloriesBurned)
        : null
    } else {
      data.rounds = Number(rounds)
      data.sparringPartner =
        sparringPartner.trim() || null
      data.techniqueType = techniqueType
    }

    return data
  }

  function conditionPayload() {
    return {
      rpe,
      bodyCondition,
      pains: hasPain
        ? Object.entries(pains).map(
            ([bodyPart, intensity]) => ({
              bodyPart,
              intensity: Number(intensity)
            })
          )
        : [],
      memo: conditionMemo.trim() || null
    }
  }

  function validate() {
    if (
      !validDate(workoutDate) ||
      !/^\d{2}:\d{2}$/.test(workoutTime)
    ) {
      return '운동 날짜와 시간을 확인해주세요.'
    }

    const dateTime = new Date(
      `${workoutDate}T${workoutTime}:00`
    )

    if (
      Number.isNaN(dateTime.getTime()) ||
      dateTime > new Date()
    ) {
      return '운동 일시는 현재 또는 과거여야 합니다.'
    }

    if (
      !duration ||
      !Number.isInteger(Number(duration)) ||
      Number(duration) < 1 ||
      Number(duration) > 600
    ) {
      return '운동 시간은 1~600분으로 입력해주세요.'
    }

    if (
      type === 'RUNNING' &&
      (
        !distanceKm ||
        !Number.isFinite(Number(distanceKm)) ||
        Number(distanceKm) <= 0
      )
    ) {
      return '러닝 거리를 입력해주세요.'
    }

    if (
      type === 'BOXING' &&
      (
        !rounds ||
        !Number.isInteger(Number(rounds)) ||
        Number(rounds) < 1
      )
    ) {
      return '복싱 라운드 수를 입력해주세요.'
    }

    if (
      caloriesBurned &&
      (
        !Number.isInteger(Number(caloriesBurned)) ||
        Number(caloriesBurned) < 1
      )
    ) {
      return '칼로리는 1 이상의 정수로 입력해주세요.'
    }

    if (
      details.some(d =>
        !d.label.trim() ||
        d.label.length > 100 ||
        !Number.isInteger(
          Number(d.durationSeconds)
        ) ||
        Number(d.durationSeconds) < 1 ||
        Number(d.durationSeconds) > 36000 ||
        d.note.length > 255
      )
    ) {
      return '세부 기록의 이름과 시간(초)을 확인해주세요.'
    }

    if (
      hasPain &&
      Object.keys(pains).length === 0
    ) {
      return '통증 부위를 하나 이상 선택해주세요.'
    }

    if (
      [
        memo,
        conditionMemo,
        place,
        sparringPartner
      ].some(value => value.length > 255)
    ) {
      return '입력 항목은 최대 255자까지 가능합니다.'
    }

    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (saving) return

    setError('')

    const validationError = savedWorkoutId
      ? null
      : validate()

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      let workoutId =
        savedWorkoutId ?? (isEdit ? id : null)

      if (!savedWorkoutId) {
        const response = isEdit
          ? await updateWorkout(
              id,
              workoutPayload()
            )
          : await createWorkout(
              workoutPayload()
            )

        if (response.status === 401) {
          clearToken()
          navigate('/login', {
            replace: true
          })
          return
        }

        if (!response.ok) {
          const data = await response
            .json()
            .catch(() => null)

          throw new Error(
            data?.message ||
            `운동 기록 저장 실패 (${response.status})`
          )
        }

        const saved = await response.json()

        workoutId = isEdit
          ? id
          : saved?.id

        if (!workoutId) {
          throw new Error(
            '저장된 운동 기록 ID를 확인할 수 없습니다.'
          )
        }

        setSavedWorkoutId(workoutId)
      }

      await saveCondition(
        workoutId,
        conditionPayload()
      )

      navigate(
        isEdit
          ? `/workouts/${workoutId}`
          : '/calendar',
        { replace: true }
      )
    } catch (e) {
      if (e.status === 401) {
        clearToken()
        navigate('/login', {
          replace: true
        })
      } else {
        setError(
          e.message || '저장에 실패했습니다.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="nrnl-workout-page">
        운동 기록 불러오는 중...
      </div>
    )
  }

  return (
    <div className="nrnl-workout-page">
      <div className="nrnl-workout-heading">
        <div>
          <span className="nrnl-workout-eyebrow">
            WORKOUT JOURNAL
          </span>

          <h1>
            {isEdit
              ? '운동 기록 수정'
              : '운동 기록 등록'}
          </h1>

          <p>
            오늘의 움직임을 기록하고,
            나만의 성장 기록을 완성하세요.
          </p>
        </div>

        <Link
          className="nrnl-workout-back"
          to="/calendar"
        >
          ← 운동 관리로
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="nrnl-workout-layout"
      >
        {/* 왼쪽 영역 */}
        <div className="nrnl-workout-main">

          {/* 01 운동 종류 */}
          <section className="nrnl-workout-panel">
            <div className="nrnl-workout-section-heading">
              <span className="nrnl-workout-section-number">
                01
              </span>
              <h2>운동 종류</h2>
            </div>

            <div className="nrnl-workout-type-grid">
              {[
                ['RUNNING', '🏃', '러닝'],
                ['BOXING', '🥊', '복싱']
              ].map(([value, icon, label]) => (
                <label
                  key={value}
                  className={
                    `nrnl-workout-type-card ${
                      type === value
                        ? 'is-active'
                        : ''
                    }`
                  }
                >
                  <input
                    type="radio"
                    name="type"
                    checked={type === value}
                    disabled={
                      isEdit || !!savedWorkoutId
                    }
                    onChange={() =>
                      setType(value)
                    }
                  />

                  <span className="nrnl-workout-type-icon">
                    {icon}
                  </span>

                  <strong>{label}</strong>
                  <small>{value}</small>
                </label>
              ))}
            </div>
          </section>

          {/* 02 운동 정보 */}
          <section className="nrnl-workout-panel">
            <div className="nrnl-workout-section-heading">
              <span className="nrnl-workout-section-number">
                02
              </span>
              <h2>운동 정보</h2>
            </div>

            <div className="nrnl-workout-fields">
              <div className="nrnl-workout-field">
                <label>운동 날짜 *</label>
                <input
                  type="date"
                  required
                  value={workoutDate}
                  disabled={!!savedWorkoutId}
                  onChange={e =>
                    setWorkoutDate(e.target.value)
                  }
                />
              </div>

              <div className="nrnl-workout-field">
                <label>시작 시간 *</label>
                <input
                  type="time"
                  required
                  value={workoutTime}
                  disabled={!!savedWorkoutId}
                  onChange={e =>
                    setWorkoutTime(e.target.value)
                  }
                />
              </div>

              <div className="nrnl-workout-field">
                <label>운동 시간 (분) *</label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  required
                  placeholder="예: 45"
                  value={duration}
                  disabled={!!savedWorkoutId}
                  onChange={e =>
                    setDuration(e.target.value)
                  }
                />
              </div>

              {type === 'RUNNING' ? (
                <>
                  <div className="nrnl-workout-field">
                    <label>거리 (km) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      placeholder="예: 5.0"
                      value={distanceKm}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        setDistanceKm(e.target.value)
                      }
                    />
                  </div>

                  <div className="nrnl-workout-field">
                    <label>운동 장소</label>
                    <input
                      maxLength={255}
                      placeholder="예: 한강공원"
                      value={place}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        setPlace(e.target.value)
                      }
                    />
                  </div>

                  <div className="nrnl-workout-field">
                    <label>소모 칼로리 (kcal)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="예: 350"
                      value={caloriesBurned}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        setCaloriesBurned(
                          e.target.value
                        )
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="nrnl-workout-field">
                    <label>총 라운드 *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="예: 8"
                      value={rounds}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        setRounds(e.target.value)
                      }
                    />
                  </div>

                  <div className="nrnl-workout-field">
                    <label>훈련 타입</label>
                    <select
                      value={techniqueType}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        setTechniqueType(
                          e.target.value
                        )
                      }
                    >
                      {TECHNIQUES.map(
                        ([value, label]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="nrnl-workout-field">
                    <label>스파링 파트너</label>
                    <input
                      maxLength={255}
                      placeholder="선택 입력"
                      value={sparringPartner}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        setSparringPartner(
                          e.target.value
                        )
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 03 세부 기록 */}
          <section className="nrnl-workout-panel">
            <div className="nrnl-workout-section-heading">
              <span className="nrnl-workout-section-number">
                03
              </span>
              <h2>세부 기록</h2>

              <button
                type="button"
                className="nrnl-workout-add-detail"
                onClick={addDetail}
                disabled={!!savedWorkoutId}
              >
                + 항목 추가
              </button>
            </div>

            {details.length === 0 ? (
              <p className="nrnl-workout-hint">
                필요한 경우 구간별 또는
                라운드별 기록을 추가하세요.
              </p>
            ) : (
              <div className="nrnl-workout-detail-list">
                {details.map(d => (
                  <div
                    className="nrnl-workout-detail-row"
                    key={d.key}
                  >
                    <input
                      aria-label="세부 기록 이름"
                      placeholder="구간 / 라운드"
                      maxLength={100}
                      value={d.label}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        changeDetail(
                          d.key,
                          'label',
                          e.target.value
                        )
                      }
                    />

                    <input
                      aria-label="지속 시간 (초)"
                      type="number"
                      min="1"
                      max="36000"
                      placeholder="시간(초)"
                      value={d.durationSeconds}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        changeDetail(
                          d.key,
                          'durationSeconds',
                          e.target.value
                        )
                      }
                    />

                    <input
                      aria-label="세부 기록 메모"
                      placeholder="메모"
                      maxLength={255}
                      value={d.note}
                      disabled={!!savedWorkoutId}
                      onChange={e =>
                        changeDetail(
                          d.key,
                          'note',
                          e.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      aria-label="세부 기록 삭제"
                      disabled={!!savedWorkoutId}
                      onClick={() =>
                        setDetails(prev =>
                          prev.filter(
                            item =>
                              item.key !== d.key
                          )
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 04 운동 메모 */}
          <section className="nrnl-workout-panel">
            <div className="nrnl-workout-section-heading">
              <span className="nrnl-workout-section-number">
                04
              </span>
              <h2>운동 메모</h2>
            </div>

            <p className="nrnl-workout-hint">
              오늘 진행한 운동 내용과 느낀 점을 기록하세요.
            </p>

            <div className="nrnl-workout-field nrnl-workout-memo-field">
              <textarea
                rows={5}
                maxLength={255}
                placeholder="예: 한강공원에서 5km 러닝, 후반부 페이스 유지"
                value={memo}
                disabled={!!savedWorkoutId}
                onChange={e =>
                  setMemo(e.target.value)
                }
              />

              <p className="nrnl-workout-char-count">
                {memo.length} / 255자
              </p>
            </div>
          </section>

          {/* 운동 메모 아래 저장 / 취소 버튼 */}
          <div className="nrnl-workout-footer">
            {error && (
              <div
                className="nrnl-workout-alert"
                role="alert"
              >
                {error}
              </div>
            )}

            {savedWorkoutId && (
              <p className="nrnl-workout-hint">
                운동 기록은 저장되었습니다.
                컨디션 저장을 다시 시도해주세요.
              </p>
            )}

            <div className="nrnl-workout-footer-actions">
              <Link
                to="/calendar"
                className="nrnl-workout-cancel-button"
              >
                취소
              </Link>

              <button
                type="submit"
                className="nrnl-workout-save-button"
                disabled={saving}
              >
                {saving
                  ? '저장 중...'
                  : savedWorkoutId
                    ? '컨디션 다시 저장하기'
                    : isEdit
                      ? '수정 내용 저장하기'
                      : '운동 기록 저장하기'}
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽 영역 */}
        <div className="nrnl-workout-side">
          <ScoreCard
            number="05"
            title="운동 체감 강도 (RPE)"
            description="오늘 운동은 얼마나 힘들었나요?"
            labels={RPE_LABELS}
            value={rpe}
            onChange={setRpe}
          />

          <ScoreCard
            number="06"
            title="운동 직후 몸 상태"
            description="운동을 마친 후 몸 상태는 어떤가요?"
            labels={CONDITION_LABELS}
            value={bodyCondition}
            onChange={setBodyCondition}
          />

          {/* 07 통증 기록 */}
          <section className="nrnl-workout-panel">
            <div className="nrnl-workout-section-heading">
              <span className="nrnl-workout-section-number">
                07
              </span>
              <h2>통증 기록</h2>
            </div>

            <p className="nrnl-workout-hint">
              운동 후 통증이 있었나요?
            </p>

            <div className="nrnl-workout-pain-choice">
              <button
                type="button"
                className={
                  !hasPain ? 'is-active' : ''
                }
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
                className={
                  hasPain ? 'is-active' : ''
                }
                aria-pressed={hasPain}
                onClick={() =>
                  setHasPain(true)
                }
              >
                통증 있음
              </button>
            </div>

            {hasPain && (
              <>
                <p className="nrnl-workout-hint nrnl-workout-pain-guide">
                  통증 부위를 선택하세요.
                  여러 부위를 선택할 수 있습니다.
                </p>

                <div className="nrnl-workout-pain-grid">
                  {BODY_PARTS.map(
                    ([part, label]) => (
                      <button
                        key={part}
                        type="button"
                        aria-pressed={
                          !!pains[part]
                        }
                        className={
                          `nrnl-workout-pain-part ${
                            pains[part]
                              ? 'is-active'
                              : ''
                          }`
                        }
                        onClick={() =>
                          togglePain(part)
                        }
                      >
                        {pains[part] ? '✓ ' : ''}
                        {label}
                      </button>
                    )
                  )}
                </div>

                {BODY_PARTS
                  .filter(
                    ([part]) => pains[part]
                  )
                  .map(([part, label]) => (
                    <div
                      className="nrnl-workout-pain-level"
                      key={part}
                    >
                      <div className="nrnl-workout-pain-title">
                        <strong>{label}</strong>
                        <span>
                          {pains[part]} / 5
                        </span>
                      </div>

                      <div className="nrnl-workout-pain-buttons">
                        {[1, 2, 3, 4, 5].map(
                          score => (
                            <button
                              key={score}
                              type="button"
                              aria-pressed={
                                pains[part] === score
                              }
                              className={
                                pains[part] === score
                                  ? 'is-active'
                                  : ''
                              }
                              onClick={() =>
                                setPains(prev => ({
                                  ...prev,
                                  [part]: score
                                }))
                              }
                            >
                              {score}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </section>

          {/* 08 컨디션 메모 */}
          <section className="nrnl-workout-panel">
            <div className="nrnl-workout-section-heading">
              <span className="nrnl-workout-section-number">
                08
              </span>
              <h2>컨디션 메모</h2>
            </div>

            <p className="nrnl-workout-hint">
              통증, 피로감 등 몸 상태를 기록해주세요.
            </p>

            <div className="nrnl-workout-field nrnl-workout-memo-field">
              <textarea
                rows={4}
                maxLength={255}
                placeholder="예: 운동 직후 무릎이 조금 불편했음"
                value={conditionMemo}
                onChange={e =>
                  setConditionMemo(e.target.value)
                }
              />

              <p className="nrnl-workout-char-count">
                {conditionMemo.length} / 255자
              </p>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
