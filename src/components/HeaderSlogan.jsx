import '../styles/header-slogan.css'

export default function HeaderSlogan() {
  return (
    <div
      className="nrnl-header-slogan"
      aria-label="こころをもやせ"
    >
      <span
        className="nrnl-header-slogan__stroke nrnl-header-slogan__stroke--left"
        aria-hidden="true"
      />

      <div className="nrnl-header-slogan__text">
        <span>こころを</span>
        <span className="nrnl-header-slogan__fire">
          もやせ
        </span>
      </div>

      <span
        className="nrnl-header-slogan__stroke nrnl-header-slogan__stroke--right"
        aria-hidden="true"
      />
    </div>
  )
}