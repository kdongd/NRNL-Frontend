import { Link, useLocation } from 'react-router-dom'

export function SignInLink({ children = '로그인', returnTo, ...props }) {
    const { pathname, search } = useLocation()
    return <Link {...props} to="/login" state={{ from: returnTo ?? pathname + search }}>{children}</Link>
}

export default function SignInNotice({ title, description = '로그인 후 이용할 수 있어요.' }) {
    return (
        <section className="club-guest">
            <h1>{title}</h1>
            <p>{description}</p>
            <SignInLink className="club-button">로그인</SignInLink>
        </section>
    )
}
