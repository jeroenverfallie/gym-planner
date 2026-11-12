import { createFileRoute } from '@tanstack/react-router'
import { FloorEditor } from '#/components/FloorEditor'

export const Route = createFileRoute('/')({
  component: Home,
  // `?workout=<id>` opens a saved workout from the catalogue.
  validateSearch: (search: Record<string, unknown>): { workout?: string } => ({
    workout: typeof search.workout === 'string' ? search.workout : undefined,
  }),
})

function Home() {
  const { workout } = Route.useSearch()
  return (
    <main className="page">
      <h1>Floor plan</h1>
      <FloorEditor loadId={workout} />
    </main>
  )
}
