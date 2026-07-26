import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Rede de segurança: um pattern com valores extremos ou um estado corrompido
// não deve derrubar a página sem saída.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro não tratado na aplicação:', error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  private resetAndReload = () => {
    // Descarta o estado compartilhado da URL, que é a fonte mais provável
    // de um estado inválido
    window.history.replaceState(null, '', window.location.pathname);
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-boundary">
        <h1>{'>'}_ Algo quebrou</h1>
        <p>
          A aplicação encontrou um erro inesperado. Você pode recarregar a página,
          ou descartar a composição atual e voltar ao estado inicial.
        </p>
        <pre className="error-boundary-detail">{this.state.error.message}</pre>
        <div className="error-boundary-actions">
          <button className="button" onClick={this.reload}>Recarregar</button>
          <button className="button-secondary" onClick={this.resetAndReload}>
            Descartar composição e recarregar
          </button>
        </div>
      </div>
    );
  }
}
