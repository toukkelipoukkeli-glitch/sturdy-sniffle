import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { WorkspaceErrorBoundary } from './WorkspaceErrorBoundary.tsx'
import { WorkspaceRoot } from './WorkspaceRoot.tsx'
import { clearWorkspaceRecoveryFixture } from './workspaceRecoveryFixture.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkspaceErrorBoundary onReset={clearWorkspaceRecoveryFixture}>
      <WorkspaceRoot />
    </WorkspaceErrorBoundary>
  </StrictMode>,
)
