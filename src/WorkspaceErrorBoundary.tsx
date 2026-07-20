import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "./components/ui/button"

const operatorSafeErrorMessage = "Workspace render failed. Please reload and contact support if the issue persists."

type WorkspaceErrorBoundaryProps = {
  children: ReactNode
  onReset?: () => void
}

type WorkspaceErrorBoundaryState = {
  error: Error | null
  errorInfo: ErrorInfo | null
}

class WorkspaceErrorBoundary extends Component<WorkspaceErrorBoundaryProps, WorkspaceErrorBoundaryState> {
  state: WorkspaceErrorBoundaryState = {
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): Partial<WorkspaceErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
  }

  resetWorkspace = () => {
    this.props.onReset?.()
    this.setState({ error: null, errorInfo: null })
  }

  render() {
    const { error, errorInfo } = this.state

    if (error) {
      const componentTrace = firstComponentTraceLine(errorInfo?.componentStack ?? undefined)

      return (
        <main className="workspace-shell workspace-error-boundary">
          <section aria-label="Workspace error" className="workspace-error-panel" role="alert">
            <div className="workspace-error-icon" aria-hidden="true">
              <AlertTriangle />
            </div>
            <div>
              <p className="eyebrow">Workspace recovery</p>
              <h1>FactoryBid OS needs a refresh</h1>
              <p>
                The workspace hit a render error. Current RFQ data is kept in the local workspace store; retry the
                render before changing the quote.
              </p>
              <dl className="workspace-error-details">
                <div>
                  <dt>Error</dt>
                  <dd>{operatorSafeErrorMessage}</dd>
                </div>
                {componentTrace ? (
                  <div>
                    <dt>Component</dt>
                    <dd>{componentTrace}</dd>
                  </div>
                ) : null}
              </dl>
              <Button onClick={this.resetWorkspace} type="button">
                <RotateCcw aria-hidden="true" />
                Reload workspace
              </Button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

function firstComponentTraceLine(componentStack: string | undefined): string | null {
  const firstLine = componentStack
    ?.split("\n")
    .map((line) => line.trim())
    .find(Boolean)

  return firstLine ?? null
}

export { WorkspaceErrorBoundary }
