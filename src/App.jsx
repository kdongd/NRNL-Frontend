
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from './layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import CoachingPage from './pages/CoachingPage'
import ConditionPage from './pages/ConditionPage'
import WorkoutFormPage from './pages/WorkoutFormPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NicknamePage from './pages/NicknamePage'
import MyPage from './pages/MyPage'
import LandingPage from './pages/LandingPage'
import ErrorBoundary from './components/ErrorBoundary'
import CommunityPage from './pages/CommunityPage'

import CrewPage from './pages/CrewPage'
import SignInNotice from './components/SignInNotice'
import { SoundControls, Soundtrack } from './components/Soundtrack'

import { isLoggedIn } from './auth/token'

const StatsPage = lazy(() => import('./pages/StatsPage'))

function AuthScreen({ children }) {
    return <><div className="sound-auth"><SoundControls /></div>{children}</>
}

function RequireAuth({ children, title = "로그인이 필요해요" }) {
    return isLoggedIn() ? children : <SignInNotice title={title} />
}

export default function App() {
    return (
        <ErrorBoundary>
            <Soundtrack>
            <Routes>
                <Route
                    path="/"
                    element={<LandingPage />}
                />

                <Route
                    path="/login"
                    element={<AuthScreen><LoginPage /></AuthScreen>}
                />

                <Route
                    path="/signup"
                    element={<AuthScreen><SignupPage /></AuthScreen>}
                />

                <Route
                    path="/nickname"
                    element={
                        <RequireAuth>
                            <AuthScreen><NicknamePage /></AuthScreen>
                        </RequireAuth>
                    }
                />

                <Route path="/welcome" element={<Navigate to="/" replace />} />
                <Route element={<AppLayout />}>
                    <Route path="/home" element={<DashboardPage />} />
                    <Route path="/activity" element={<Navigate to="/home" replace />} />
                    <Route path="/calendar" element={<CalendarPage />} />

                    {/* 기존 운동 기록 주소는 운동 관리로 이동 */}
                    <Route
                        path="/workouts"
                        element={<Navigate to="/calendar" replace />}
                    />

                    <Route
                        path="/workouts/new"
                        element={<RequireAuth title="운동 기록 추가"><WorkoutFormPage mode="create" /></RequireAuth>}
                    />

                    <Route
                        path="/workouts/:id"
                        element={<RequireAuth title="운동 기록"><WorkoutDetailPage /></RequireAuth>}
                    />

                    <Route
                        path="/workouts/:id/edit"
                        element={<RequireAuth title="운동 기록 수정"><WorkoutFormPage mode="edit" /></RequireAuth>}
                    />

                    <Route
                        path="/workouts/:id/condition"
                        element={<RequireAuth title="컨디션 기록"><ConditionPage /></RequireAuth>}
                    />

                    <Route
                        path="/stats"
                        element={<RequireAuth title="운동 통계"><Suspense fallback={<p role="status">통계를 불러오는 중…</p>}><StatsPage /></Suspense></RequireAuth>}
                    />

                    <Route
                        path="/coaching"
                        element={<RequireAuth title="AI 코칭"><CoachingPage /></RequireAuth>}
                    />

                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/community/posts/:id" element={<CommunityPage />} />
                    <Route path="/community/new" element={<RequireAuth title="글쓰기"><CommunityPage /></RequireAuth>} />
                    <Route path="/community/posts/:id/edit" element={<RequireAuth title="게시글 수정"><CommunityPage /></RequireAuth>} />
                    <Route path="/crews" element={<CrewPage />} />
                    <Route path="/crews/:id" element={<CrewPage />} />
                    <Route path="/crews/new" element={<RequireAuth title="크루 만들기"><CrewPage mode="create" /></RequireAuth>} />
                    <Route path="/crews/:id/edit" element={<RequireAuth title="크루 수정"><CrewPage mode="edit" /></RequireAuth>} />
                    <Route
                        path="/my-page"
                        element={<RequireAuth title="나의 정보"><MyPage /></RequireAuth>}
                    />
                </Route>

                <Route
                    path="*"
                    element={<Navigate to="/welcome" replace />}
                />
            </Routes>
            </Soundtrack>
        </ErrorBoundary>
    )
}
