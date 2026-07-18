import { render, screen } from '@testing-library/react'
import { ConceptCard } from '@/components/concept-card'

describe('ConceptCard', () => {
  it('renders the title as a heading and the description', () => {
    render(<ConceptCard title="Design tokens" description="A typed token system." status="planned" />)
    expect(screen.getByRole('heading', { name: 'Design tokens' })).toBeInTheDocument()
    expect(screen.getByText('A typed token system.')).toBeInTheDocument()
  })

  it('exposes the status through an accessible label', () => {
    render(<ConceptCard title="Streaming" description="Stream HTML." status="in-progress" />)
    expect(screen.getByLabelText('Status: In progress')).toHaveTextContent('In progress')
  })

  it('renders a link when href is provided', () => {
    render(<ConceptCard title="Streaming" description="Stream HTML." status="done" href="/streaming" />)
    const link = screen.getByRole('link', { name: 'Streaming' })
    expect(link).toHaveAttribute('href', '/streaming')
  })

  it('renders static content, not a link, when href is omitted', () => {
    render(<ConceptCard title="Planned thing" description="Not built yet." status="planned" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Planned thing')).toBeInTheDocument()
  })
})
