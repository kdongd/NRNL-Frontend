import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { communityRequest as api, queryString } from '../api/communityApi'
import { getCurrentUserId, isLoggedIn } from '../auth/token'
import { SignInLink } from '../components/SignInNotice'

const fmt = value => value ? new Date(value).toLocaleString('ko-KR') : '-'
const msg = e => e?.message || '오류가 발생했습니다.'
function Pagination({page,total,onChange}) { return <div className="community-pager"><button disabled={page===0} onClick={()=>onChange(page-1)}>‹ 이전</button><span>{page+1} / {Math.max(1,total)}</span><button disabled={page>=total-1} onClick={()=>onChange(page+1)}>다음 ›</button></div> }
function Like({path}) {
 const [status,setStatus]=useState(null),[busy,setBusy]=useState(false)
 const load=useCallback(()=>api(path).then(setStatus).catch(()=>setStatus(null)),[path])
 useEffect(()=>{load()},[load])
 async function toggle(){setBusy(true);try{await api(path,{method:status?.likedByMe?'DELETE':'POST'});await load()}catch(e){alert(msg(e))}finally{setBusy(false)}}
 if (!isLoggedIn()) return <SignInLink className="community-like">좋아요 {status?.likeCount ?? ''}</SignInLink>
 return <button className={'community-like '+(status?.likedByMe?'liked':'')} disabled={busy} onClick={toggle}>♥ {status?.likeCount ?? '–'}</button>
}
function Comments({postId}) {
 const [data,setData]=useState(null),[page,setPage]=useState(0),[content,setContent]=useState(''),[editing,setEditing]=useState(null),[draft,setDraft]=useState(''),[error,setError]=useState('')
 const load=useCallback(()=>api(`/posts/${postId}/comments?${queryString({page,size:10,sort:'createdAt,asc'})}`).then(setData).catch(e=>setError(msg(e))),[postId,page])
 useEffect(()=>{load()},[load])
 async function create(e){e.preventDefault();if(!content.trim())return;try{await api(`/posts/${postId}/comments`,{method:'POST',body:JSON.stringify({content:content.trim()})});setContent('');setPage(0);load()}catch(e){setError(msg(e))}}
 async function remove(id){if(!confirm('댓글을 삭제할까요?'))return;try{await api(`/posts/${postId}/comments/${id}`,{method:'DELETE'});load()}catch(e){setError(msg(e))}}
 async function update(id){try{await api(`/posts/${postId}/comments/${id}`,{method:'PUT',body:JSON.stringify({content:draft.trim()})});setEditing(null);load()}catch(e){setError(msg(e))}}
 return <section className="community-panel"><h2>댓글 {data?.totalElements ?? ''}</h2>{isLoggedIn() ? <form className="community-comment-form" onSubmit={create}><textarea maxLength={200} value={content} onChange={e=>setContent(e.target.value)} placeholder="댓글을 입력해주세요 (최대 200자)"/><button className="community-primary">댓글 등록</button></form> : <p>댓글을 남기려면 <SignInLink>로그인</SignInLink>해 주세요.</p>}{error&&<p className="community-error">{error}</p>}{(data?.content||[]).map(c=><div className="community-comment" key={c.id}><div className="community-comment-head"><b>{c.authorNickname}</b><small>{fmt(c.createdAt)}</small><Like path={`/posts/${postId}/comments/${c.id}/likes`}/></div>{editing===c.id?<><textarea maxLength={200} value={draft} onChange={e=>setDraft(e.target.value)}/><button onClick={()=>update(c.id)}>저장</button><button onClick={()=>setEditing(null)}>취소</button></>:<p>{c.content}</p>}{getCurrentUserId() === c.authorId && <div className="community-inline-actions"><button onClick={()=>{setEditing(c.id);setDraft(c.content)}}>수정</button><button onClick={()=>remove(c.id)}>삭제</button></div>}</div>)}<Pagination page={page} total={data?.totalPages||1} onChange={setPage}/></section>
}
function Feed(){
 const [data,setData]=useState(null),[page,setPage]=useState(0),[mode,setMode]=useState('all'),[type,setType]=useState('title'),[keyword,setKeyword]=useState(''),[search,setSearch]=useState(''),[sort,setSort]=useState('createdAt,desc'),[error,setError]=useState('')
 const load=useCallback(()=>{let path=mode==='mine'?'/posts/me':mode==='search'?`/posts/search?${queryString({type,keyword:search})}&`:'/posts?';if(mode==='mine')path+='?';api(`${path}${queryString({page,size:10,sort})}`).then(setData).catch(e=>{setError(msg(e));setData(null)})},[mode,type,search,page,sort])
 useEffect(()=>{load()},[load])
 function submit(e){e.preventDefault();if(!keyword.trim())return;setSearch(keyword.trim());setMode('search');setPage(0)}
 return <><div className="community-heading"><div><h1>커뮤니티</h1></div><Link className="community-primary" to="/community/new">글쓰기</Link></div><div className="community-tools"><div className="community-tabs"><button className={mode==='all'?'selected':''} onClick={()=>{setMode('all');setPage(0)}}>전체</button>{isLoggedIn() && <button className={mode==='mine'?'selected':''} onClick={()=>{setMode('mine');setPage(0)}}>내 게시글</button>}</div><form onSubmit={submit}><select value={type} onChange={e=>setType(e.target.value)}><option value="title">제목</option><option value="nickname">닉네임</option></select><input placeholder="게시글 검색" value={keyword} onChange={e=>setKeyword(e.target.value)}/><button>검색</button></form><select value={sort} onChange={e=>{setSort(e.target.value);setPage(0)}}><option value="createdAt,desc">최신순</option><option value="createdAt,asc">오래된순</option></select></div>{mode==='search'&&<p className="community-search-info">‘{search}’ 검색 결과 <button onClick={()=>{setMode('all');setPage(0)}}>초기화</button></p>}{error&&<p className="community-error">{error}</p>}<div className="community-panel community-table-wrap"><table className="community-table"><thead><tr><th>번호</th><th>제목</th><th>작성자</th><th>작성일</th></tr></thead><tbody>{(data?.content||[]).map(post=><tr key={post.id}><td>{post.id}</td><td><Link to={`/community/posts/${post.id}`}>{post.title}</Link></td><td>{post.authorNickname}</td><td>{fmt(post.createdAt)}</td></tr>)}</tbody></table>{data?.content?.length===0&&<p className="community-empty">게시글이 없습니다.</p>}</div><Pagination page={page} total={data?.totalPages||1} onChange={setPage}/></>
}
function Editor({id}){
 const navigate=useNavigate(),[title,setTitle]=useState(''),[content,setContent]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 useEffect(()=>{if(id)api(`/posts/${id}`).then(p=>{setTitle(p.title);setContent(p.content)}).catch(e=>setError(msg(e)))},[id])
 async function save(e){e.preventDefault();setSaving(true);try{const p=await api(id?`/posts/${id}`:'/posts',{method:id?'PUT':'POST',body:JSON.stringify({title:title.trim(),content:content.trim()})});navigate(`/community/posts/${p.id}`)}catch(e){setError(msg(e))}finally{setSaving(false)}}
 return <><div className="community-heading"><div><Link className="community-back" to={id?`/community/posts/${id}`:'/community'}>← 커뮤니티</Link><h1>{id?'게시글 수정':'글 작성하기'}</h1></div></div><form className="community-panel community-editor" onSubmit={save}><label>제목 <small>{title.length}/50</small></label><input required maxLength={50} value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목을 입력해주세요"/><label>내용 <small>{content.length}/1000</small></label><textarea required maxLength={1000} value={content} onChange={e=>setContent(e.target.value)} placeholder="운동 이야기를 자유롭게 작성해보세요"/>{error&&<p className="community-error">{error}</p>}<div className="community-editor-actions"><Link to="/community" className="community-secondary">취소</Link><button className="community-primary" disabled={saving}>{saving?'저장 중...':id?'수정 완료':'등록'}</button></div></form></>
}
function Detail({id}){
 const navigate=useNavigate(),[post,setPost]=useState(null),[error,setError]=useState('')
 useEffect(()=>{api(`/posts/${id}`).then(setPost).catch(e=>setError(msg(e)))},[id])
 async function remove(){if(!confirm('게시글을 삭제할까요?'))return;try{await api(`/posts/${id}`,{method:'DELETE'});navigate('/community')}catch(e){setError(msg(e))}}
 return <><Link className="community-back" to="/community">← 커뮤니티 목록</Link>{error&&<p className="community-error">{error}</p>}{post&&<><article className="community-panel community-detail"><div className="community-detail-top"><h1>{post.title}</h1><Like path={`/posts/${id}/likes`}/></div><div className="community-meta"><b>{post.authorNickname}</b><span>{fmt(post.createdAt)}</span></div><div className="community-post-body">{post.content}</div>{getCurrentUserId() === post.authorId && <div className="community-inline-actions"><Link to={`/community/posts/${id}/edit`}>수정</Link><button onClick={remove}>삭제</button></div>}</article><Comments postId={id}/></>}</>
}
export default function CommunityPage(){const {id}=useParams(),{pathname}=useLocation();return <div className="community-page">{pathname.endsWith('/new')?<Editor/>:pathname.endsWith('/edit')?<Editor id={id}/>:id?<Detail id={id}/>:<Feed/>}</div>}
