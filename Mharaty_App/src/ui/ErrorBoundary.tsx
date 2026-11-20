import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface State { hasError: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('خطأ غير متوقع في التطبيق:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ direction: 'rtl', textAlign: 'center', padding: '60px 20px', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
        <div style={{ fontSize: '48px' }}>😕</div>
        <h2 style={{ color: '#2d3d52' }}>حدث خطأ غير متوقع</h2>
        <p style={{ color: '#64748b' }}>نعتذر عن ذلك. حاول إعادة تحميل التطبيق.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ backgroundColor: '#8b44db', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          إعادة التحميل
        </button>
      </div>
    );
  }
}
