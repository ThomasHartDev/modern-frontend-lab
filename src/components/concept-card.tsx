import type { ReactNode } from 'react'

export type ConceptStatus = 'planned' | 'in-progress' | 'done'

export interface ConceptCardProps {
  title: string
  description: string
  status: ConceptStatus
  href?: string
}

const STATUS_LABEL: Record<ConceptStatus, string> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  done: 'Done'
}

const cardStyle: React.CSSProperties = {
  display: 'block',
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface)',
  color: 'inherit',
  textDecoration: 'none'
}

export function ConceptCard({ title, description, status, href }: ConceptCardProps) {
  const body: ReactNode = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h2>
        <span aria-label={`Status: ${STATUS_LABEL[status]}`} data-status={status} style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-muted)' }}>{description}</p>
    </>
  )

  // A planned concept has no route yet, so it renders as static content, not a dead link.
  if (href === undefined) {
    return (
      <article style={cardStyle} aria-label={title}>
        {body}
      </article>
    )
  }

  return (
    <a href={href} style={cardStyle} aria-label={title}>
      {body}
    </a>
  )
}
