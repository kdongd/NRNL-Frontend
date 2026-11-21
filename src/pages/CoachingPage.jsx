import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchAssessment,
  fetchLatestCoaching,
  generateCoaching,
} from '../api/coachingApi'
import { clearToken } from '../auth/token'
import '../styles/coaching-chat.css'

const LEVELS = {
  STOP: ['운동 중단 권고', 'danger'],
  REST: ['휴식 권고', 'warning'],
  REDUCE: ['강도 감소 권고', 'warning'],
  NORMAL: ['운동 상태 양호', 'success'],
  INSUFFICIENT_DATA: ['데이터 부족', 'neutral'],
}

function CoachMessage({ children, mood = 'happy' }) {
  return (
    <div className="nrnl-chat-line">
      <img
        className="nrnl-coach-avatar"
        src={`/images/coach-${mood}.png`}
        alt="불꽃 머리 AI 코치"
      />
      <div className="nrnl-chat-bubble">{children}</div>
    </div>
  )
}

export default function CoachingPage() {
  const [assessment, setAssessment] = useState(null)
  const [coaching, setCoaching] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    async function loadCoachingPage() {
      setLoading(true)
      setError('')

      try {
        // 운동 상태 판정 조회
        const assessmentData = await fetchAssessment()

        if (!active) return
        setAssessment(assessmentData)

        // DB에 저장된 기존 AI 코칭 조회
        const latestCoaching = await fetchLatestCoaching()

        if (!active) return

        if (latestCoaching?.status === 'GENERATED' && latestCoaching.coaching) {
          setCoaching(latestCoaching)
        } else {
          setCoaching(null)
        }
      } catch (err) {
        if (!active) return

        if (err.status === 401) {
          clearToken()
          navigate('/login', { replace: true })
        } else {
          setError(err.message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCoachingPage()

    return () => {
      active = false
    }
  }, [navigate])

  async function handleGenerate() {
    setGenerating(true)
    setError('')

    try {
      const data = await generateCoaching()
      setCoaching(data)
    } catch (err) {
      if (err.status === 401) {
        clearToken()
        navigate('/login', { replace: true })
      } else {
        setError(err.message)
      }
    } finally {
      setGenerating(false)
    }
  }

  const current = coaching || assessment
  const level = LEVELS[current?.level] || LEVELS.INSUFFICIENT_DATA

  const result =
    coaching?.status === 'GENERATED'
      ? coaching.coaching
      : null

  const blocked = coaching && !result

  return (
    <div className="nrnl-coaching-page">
      <div className="nrnl-coaching-heading">
        <div>
          <h1>
            AI 운동 코칭 <span>✦</span>
          </h1>
          <p>
            최근 운동과 컨디션을 분석해 오늘의 운동 방향을 확인해요.
          </p>
        </div>

        <div className="nrnl-coach-quote">
          🔥 한 걸음 더 나아가는 너를 응원한다!
        </div>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="nrnl-chat-grid">
        <section
          className="nrnl-chat-panel"
          aria-label="AI 운동 코칭 대화"
        >
          <div className="nrnl-chat-messages">
            <CoachMessage>
              좋은 하루군! 🔥
              <br />
              최근 운동 기록을 함께 살펴보자!
            </CoachMessage>

            <div className="nrnl-chat-line nrnl-chat-line--user">
              <div className="nrnl-chat-bubble">
                지금 내 운동 상태는 어때?
              </div>
              <span className="nrnl-user-avatar">●</span>
            </div>

            <CoachMessage mood="think">
              {loading ? (
                '운동 기록을 확인하고 있어. 잠시만 기다려 줘!'
              ) : (
                <>
                  최근 운동 상태는{' '}
                  <strong className={`nrnl-level-${level[1]}`}>
                    {level[0]}
                  </strong>
                  이야.

                  {current?.evaluatedFrom && (
                    <p className="nrnl-chat-sub">
                      판정 기간: {current.evaluatedFrom} ~{' '}
                      {current.evaluatedTo}
                    </p>
                  )}

                  {current?.reasons?.length > 0 ? (
                    <ul className="nrnl-chat-reasons">
                      {current.reasons.map((reason, i) => (
                        <li key={`${reason.rule}-${i}`}>
                          <b>{reason.rule}</b> {reason.detail}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="nrnl-chat-sub">
                      {current?.level === 'NORMAL'
                        ? '최근 운동 기록에서 별도로 표시할 위험 요인이 발견되지 않았어! 🔥'
                        : '현재 제공된 운동 상태 판정에 상세 근거가 없어.'}
                    </p>
                  )}
                </>
              )}
            </CoachMessage>

            <div className="nrnl-chat-line nrnl-chat-line--user">
              <div className="nrnl-chat-bubble">
                오늘은 어떤 운동을 하면 좋을까?
              </div>
              <span className="nrnl-user-avatar">●</span>
            </div>

            <CoachMessage mood="happy">
              {loading ? (
                '이전에 받은 AI 코칭이 있는지 확인하고 있어!'
              ) : result ? (
                <>
                  <strong className="nrnl-chat-result-title">
                    {result.summary}
                  </strong>

                  {result.explanation && (
                    <p>{result.explanation}</p>
                  )}

                  {result.recommendations?.length > 0 && (
                    <div className="nrnl-recommend-box">
                      <strong>🔥 오늘의 추천 행동</strong>
                      <ul>
                        {result.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.caution && (
                    <div className="nrnl-caution">
                      ⚠️ {result.caution}
                    </div>
                  )}
                </>
              ) : blocked ? (
                <>
                  {coaching.status === 'SKIPPED_INSUFFICIENT_DATA'
                    ? '운동 후 컨디션 기록이 부족해 AI 코칭을 생성하지 못했어. 컨디션을 더 기록해 줘!'
                    : '지금은 AI 코칭을 생성할 수 없어. 운동 상태 판정은 위에서 확인할 수 있어.'}
                </>
              ) : (
                <>
                  네 운동 데이터를 바탕으로 맞춤 코칭을 만들어 줄게!

                  <p className="nrnl-chat-sub">
                    아래 버튼을 누르면 실제 AI 코칭을 생성해.
                    외부 AI 서비스가 호출될 수 있어.
                  </p>
                </>
              )}
            </CoachMessage>
          </div>

          <div className="nrnl-chat-actionbar">
            <span className="nrnl-chat-placeholder">
              운동 기록을 기반으로 AI 코칭을 받아보세요
            </span>

            <button
              type="button"
              className="nrnl-chat-generate"
              onClick={handleGenerate}
              disabled={loading || generating}
            >
              {generating ? '생성 중…' : '✦ AI 코칭 받기'}
            </button>
          </div>
        </section>

        <aside className="nrnl-coach-side">
          <section className="nrnl-coach-card">
            <div className="nrnl-card-title">
              <h2>최근 운동 상태</h2>
              <Link to="/calendar">더보기 ›</Link>
            </div>

            <div
              className={`nrnl-condition nrnl-condition--${level[1]}`}
            >
              <span>✦</span>

              <div>
                <strong>
                  {loading ? '확인 중…' : level[0]}
                </strong>

                <small>
                  {loading
                    ? '운동 데이터를 불러오고 있어요'
                    : current?.evaluatedFrom
                      ? `${current.evaluatedFrom} ~ ${current.evaluatedTo}`
                      : '최근 운동 기록 기준'}
                </small>
              </div>
            </div>

            <p className="nrnl-side-note">
              운동 상태는 실제 저장된 운동 및 컨디션 기록을
              기준으로 판단합니다.
            </p>
          </section>

          <section className="nrnl-coach-card">
            <h2>🔥 오늘의 추천 키워드</h2>

            <div className="nrnl-tags">
              {result?.recommendations?.length ? (
                result.recommendations.slice(0, 3).map((r, i) => (
                  <span key={i}>{r}</span>
                ))
              ) : (
                <span>AI 코칭을 생성해 주세요</span>
              )}
            </div>
          </section>

          <section className="nrnl-coach-card">
            <h2>▥ AI 분석 요약</h2>

            <p>
              {result?.summary ||
                'AI 코칭 받기 버튼을 누르면 운동 기록을 분석한 결과가 이곳에 표시됩니다.'}
            </p>
          </section>

          <section className="nrnl-coach-card nrnl-coach-tip">
            <h2>💡 코치의 꿀팁</h2>

            <div>
              <p>
                꾸준히 기록할수록 더 정확한 코칭에 도움이 돼! 🔥
              </p>

              <img
                src="/images/coach-happy.png"
                alt="웃고 있는 불꽃 머리 코치"
              />
            </div>
          </section>

          <Link to="/calendar" className="nrnl-record-link">
            운동 기록 보러가기 →
          </Link>

          <p className="nrnl-coach-disclaimer">
            AI 운동 코칭은 의료 진단이 아닙니다.
            심한 통증이나 이상 증상이 있으면 운동을 중단하고
            전문가와 상담하세요.
          </p>
        </aside>
      </div>
    </div>
  )
}