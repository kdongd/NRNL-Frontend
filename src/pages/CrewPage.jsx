import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { crewList, crewRequest, crewStatus, sportLabel } from '../api/crewApi'
import { getCurrentUserId, isLoggedIn } from '../auth/token'
import { SignInLink } from '../components/SignInNotice'
import useRemote from '../components/useRemote'

const capacities = [10, 30, 50, 70, 100]
const applicationStatuses = {
    PENDING: '대기 중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소'
}

function CrewFacts({ crew }) {
    return <p className="crew-facts">{crew.sports.map(sport => sportLabel[sport]).join(' · ')} <span>{crew.memberCount}/{crew.capacity}명</span></p>
}

function StateMessage({ request, empty }) {
    if (request.loading) return <p role="status" className="club-muted">불러오는 중…</p>
    if (request.error) return <div className="crew-state" role="alert"><p>{request.error}</p><button className="club-button" onClick={request.reload}>다시 시도</button></div>
    return empty ? <p className="club-muted">{empty}</p> : null
}

function Pager({ data, page, setPage }) {
    if (!data || data.totalPages < 2) return null
    return <nav className="crew-pager" aria-label="목록 페이지">
        <button className="club-button" disabled={page === 0} onClick={() => setPage(page - 1)}>이전</button>
        <span>{page + 1} / {data.totalPages}</span>
        <button className="club-button" disabled={data.last} onClick={() => setPage(page + 1)}>다음</button>
    </nav>
}

function CrewList() {
    const [keyword, setKeyword] = useState('')
    const [name, setName] = useState('')
    const [sport, setSport] = useState('')
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(0)
    const request = useRemote(useCallback(() => crewList({ name, sport, status, page, size: 10 }), [name, sport, status, page]))
    return <div className="crew-page">
        <div className="crew-title"><h1>크루</h1><Link className="club-button club-button--light" to="/crews/new">크루 만들기</Link></div>
        <form className="crew-filters" onSubmit={event => { event.preventDefault(); setName(keyword.trim()); setPage(0) }}>
            <label className="crew-search">크루 이름
                <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="크루 이름으로 검색" />
            </label>
            <label>운동 종목<select aria-label="운동 종목" value={sport} onChange={event => { setSport(event.target.value); setPage(0) }}>
                <option value="">전체</option>
                {Object.entries(sportLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select></label>
            <label>모집 상태<select aria-label="모집 상태" value={status} onChange={event => { setStatus(event.target.value); setPage(0) }}>
                <option value="">전체</option>
                {Object.entries(crewStatus).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select></label>
            <button className="club-button" type="submit">검색</button>
        </form>
        <StateMessage request={request} empty={!request.data?.content.length && '조건에 맞는 크루가 없어요.'} />
        <ul className="crew-results">{request.data?.content.map(crew => <li key={crew.id}>
            <Link to={`/crews/${crew.id}`}>
                <div><h2>{crew.name}</h2><CrewFacts crew={crew} /></div>
                <span className={`crew-status ${crew.status === 'OPEN' && crew.memberCount < crew.capacity ? 'is-open' : ''}`}>
                    {crew.status === 'OPEN' && crew.memberCount >= crew.capacity ? '정원 마감' : crewStatus[crew.status]}
                </span>
            </Link>
        </li>)}</ul>
        <Pager data={request.data} page={page} setPage={setPage} />
    </div>
}

function CrewForm({ crew }) {
    const navigate = useNavigate()
    const [name, setName] = useState(crew?.name || '')
    const [description, setDescription] = useState(crew?.description || '')
    const [sports, setSports] = useState(crew?.sports || [])
    const [capacity, setCapacity] = useState(crew?.capacity || 10)
    const [status, setStatus] = useState(crew?.status || 'OPEN')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const descriptionLength = [...description].length

    async function submit(event) {
        event.preventDefault()
        if (saving) return
        if (!/^[가-힣a-zA-Z0-9]{2,20}$/.test(name)) {
            setError('크루 이름은 한글, 영문, 숫자만 2~20자로 입력해 주세요.')
            return
        }
        if (!description.trim() || descriptionLength < 10 || descriptionLength > 500 || !sports.length) {
            setError('소개는 10~500자로 입력하고 운동 종목을 한 개 이상 선택해 주세요.')
            return
        }
        setError('')
        setSaving(true)
        try {
            const body = { name, description, sports, capacity }
            if (crew) body.status = status
            const saved = await crewRequest(crew ? `/${crew.id}` : '', { method: crew ? 'PUT' : 'POST', body })
            navigate(`/crews/${saved.id}`, { replace: true })
        } catch (failure) {
            setError(failure.message)
        } finally {
            setSaving(false)
        }
    }

    function toggleSport(sport) {
        setSports(current => current.includes(sport) ? current.filter(value => value !== sport) : [...current, sport])
    }

    return <div className="crew-page">
        <div className="crew-title"><h1>{crew ? '크루 수정' : '크루 만들기'}</h1></div>
        <form className="crew-form" onSubmit={submit}>
            <label>크루 이름<input required maxLength={20} value={name} onChange={event => setName(event.target.value)} /></label>
            <label>소개 <small>{descriptionLength}/500자</small><textarea required rows={5} value={description} onChange={event => setDescription(event.target.value)} /></label>
            <fieldset><legend>운동 종목</legend>
                {Object.entries(sportLabel).map(([key, label]) => <label className="crew-check" key={key}>
                    <input type="checkbox" checked={sports.includes(key)} onChange={() => toggleSport(key)} />{label}
                </label>)}
            </fieldset>
            <label>정원<select aria-label="정원" value={capacity} onChange={event => setCapacity(Number(event.target.value))}>
                {capacities.filter(value => value >= (crew?.capacity || 0)).map(value => <option key={value} value={value}>{value}명</option>)}
            </select></label>
            {crew && <label>모집 상태<select aria-label="모집 상태" value={status} onChange={event => setStatus(event.target.value)}>
                {Object.entries(crewStatus).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select></label>}
            {error && <p className="crew-error" role="alert">{error}</p>}
            <div className="crew-actions">
                <Link className="club-button" to={crew ? `/crews/${crew.id}` : '/crews'}>취소</Link>
                <button className="club-button club-button--light" disabled={saving}>{saving ? '저장 중…' : '저장'}</button>
            </div>
        </form>
    </div>
}

function ApplicationList({ id, run, busy, revision }) {
    const [page, setPage] = useState(0)
    const request = useRemote(useCallback(() => crewRequest(`/${id}/applications?page=${page}&size=10`), [id, page, revision]))
    return <section className="crew-section">
        <h2>가입 신청</h2>
        <StateMessage request={request} empty={!request.data?.content.length && '가입 신청이 없어요.'} />
        {request.data?.content.map(application => <div className="crew-member" key={application.id}>
            <div><strong>신청자 #{application.userId}</strong><small>{new Date(application.createdAt).toLocaleDateString('ko-KR')} · {applicationStatuses[application.status]}</small></div>
            {application.status === 'PENDING' && <div className="crew-actions">
                <button className="club-button club-button--light" disabled={busy} onClick={() => run(`/applications/${application.id}/approve`)}>승인</button>
                <button className="club-button" disabled={busy} onClick={() => run(`/applications/${application.id}/reject`)}>거절</button>
            </div>}
        </div>)}
        <Pager data={request.data} page={page} setPage={setPage} />
    </section>
}

function CrewDetail({ id, edit }) {
    const navigate = useNavigate()
    const signedIn = isLoggedIn()
    const userId = getCurrentUserId()
    const storageKey = `nrnl.crew.application.${userId}.${id}`
    const [pending, setPending] = useState(() => localStorage.getItem(storageKey))
    const [notice, setNotice] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [revision, setRevision] = useState(0)
    const detail = useRemote(useCallback(() => crewRequest(`/${id}`), [id]))
    const members = useRemote(useCallback(() => signedIn ? crewRequest(`/${id}/members`) : Promise.resolve(null), [id, signedIn]))
    const crew = detail.data
    const membership = members.data?.find(member => member.userId === userId)
    const leader = membership?.leader === true

    function rememberPending(value) {
        setPending(value)
        if (value) localStorage.setItem(storageKey, value)
        else localStorage.removeItem(storageKey)
    }

    async function run(path, method = 'POST', body, confirmation) {
        if (busy || (confirmation && !window.confirm(confirmation))) return
        setBusy(true)
        setError('')
        setNotice('')
        try {
            const result = await crewRequest(`/${id}${path}`, { method, body })
            if (path === '' && method === 'DELETE') {
                rememberPending(null)
                navigate('/crews', { replace: true })
                return
            }
            if (path === '/applications') rememberPending(String(result.id))
            if (path.endsWith('/cancel')) rememberPending(null)
            const messages = {
                '/applications': '가입 신청을 보냈어요.',
                '/leader': '크루장 권한을 이전했어요.',
                '/members/me': '크루에서 탈퇴했어요.'
            }
            setNotice(messages[path] || '처리했어요.')
            detail.reload()
            members.reload()
            setRevision(value => value + 1)
        } catch (failure) {
            if (path.endsWith('/cancel') && [404, 409].includes(failure.status)) {
                rememberPending(null)
                detail.reload()
                members.reload()
            }
            setError(failure.message)
        } finally {
            setBusy(false)
        }
    }

    if (!crew || (edit && members.loading)) return <StateMessage request={!crew ? detail : members} />
    if (edit && !leader) return <p role="alert">{members.error || '크루장만 크루 정보를 수정할 수 있어요.'}</p>
    if (edit) return <CrewForm crew={crew} />

    const available = crew.status === 'OPEN' && crew.memberCount < crew.capacity
    return <div className="crew-page">
        <Link className="crew-back" to="/crews">← 크루 목록</Link>
        <div className="crew-title"><h1>{crew.name}</h1><span className="crew-status">{crewStatus[crew.status]}</span></div>
        <CrewFacts crew={crew} />
        <p className="crew-description">{crew.description}</p>
        <div className="crew-actions">
            {!signedIn && available && <SignInLink className="club-button club-button--light">로그인하고 가입 신청</SignInLink>}
            {signedIn && !members.loading && !members.error && !membership && pending &&
                <button className="club-button" disabled={busy} onClick={() => run(`/applications/${pending}/cancel`)}>내 신청 취소</button>}
            {signedIn && !members.loading && !members.error && !membership && available &&
                <button className="club-button club-button--light" disabled={busy} onClick={() => run('/applications')}>가입 신청</button>}
            {membership && !leader && <button className="club-button" disabled={busy}
                onClick={() => run('/members/me', 'DELETE', undefined, '크루에서 탈퇴할까요?')}>크루 탈퇴</button>}
            {leader && <>
                <Link className="club-button" to={`/crews/${id}/edit`}>정보 수정</Link>
                <button className="club-button crew-danger" disabled={busy} onClick={() => run('', 'DELETE', undefined, '크루와 관련된 신청 이력을 함께 삭제할까요?')}>크루 삭제</button>
            </>}
        </div>
        {!available && !membership && <p className="club-muted">{crew.status === 'CLOSED' ? '모집이 마감됐어요.' : '정원이 모두 찼어요.'}</p>}
        <div aria-live="polite">{notice && <p>{notice}</p>}{error && <p className="crew-error" role="alert">{error}</p>}</div>
        <section className="crew-section">
            <h2>크루원</h2>
            {signedIn ? <>
                <StateMessage request={members} />
                {members.data?.map(member => <div className="crew-member" key={member.userId}>
                    <div><strong>{member.nickname || '닉네임 미설정'}</strong>{member.leader && <small>크루장</small>}</div>
                    {leader && !member.leader && <div className="crew-actions">
                        <button className="club-button" disabled={busy}
                            onClick={() => run('/leader', 'PUT', { userId: member.userId }, '이 크루원에게 크루장 권한을 이전할까요?')}>권한 이전</button>
                        <button className="club-button crew-danger" disabled={busy}
                            onClick={() => run(`/members/${member.userId}`, 'DELETE', undefined, '이 크루원을 강제퇴출할까요?')}>강제퇴출</button>
                    </div>}
                </div>)}
            </> : <p className="club-muted">크루원 목록은 <SignInLink>로그인</SignInLink> 후 볼 수 있어요.</p>}
        </section>
        {leader && <ApplicationList id={id} run={run} busy={busy} revision={revision} />}
    </div>
}

export default function CrewPage({ mode }) {
    const { id } = useParams()
    if (mode === 'create') return <CrewForm />
    return id ? <CrewDetail key={id} id={id} edit={mode === 'edit'} /> : <CrewList />
}
