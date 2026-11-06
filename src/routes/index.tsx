import { createFileRoute } from '@tanstack/react-router'
import { FloorEditor } from '#/components/FloorEditor'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="page">
      <h1>Floor plan</h1>
      <p className="sub">
        Mark dead space (pillars, doors, walls) and the surfaces: standard tiles and the turf.
      </p>
      <FloorEditor />
    </main>
  )
}
