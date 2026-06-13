import { Component } from 'react';

/**
 * ErrorBoundary catches JavaScript errors in child components
 * and displays a Turkish error message with a retry button.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
          <div className="text-center max-w-md mx-auto">
            {/* Error icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-heading font-bold text-text-primary mb-3">
              Bir hata oluştu
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Üzgünüz, beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin.
            </p>

            <button
              onClick={this.handleRetry}
              className="
                inline-flex items-center gap-2 px-6 py-3
                bg-primary hover:bg-primary-hover
                text-bg-primary font-semibold rounded-lg
                transition-all duration-200
                focus-ring cursor-pointer
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              Yeniden Dene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
