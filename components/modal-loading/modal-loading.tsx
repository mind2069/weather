import "./styles.css";

interface LoadingProperties
{
    label?: string;
}

export default function Loading({ label = "Loading" }: LoadingProperties)
{
    return (
        <div className="loading-overlay">
            <div className="loading-backdrop" aria-hidden />
            <div
                className="loading-dialog"
                role="dialog"
                aria-modal="true"
                aria-busy="true"
                aria-live="polite"
            >
                <div className="loading-block">
                    <div className="loading-block-inner">
                        <span className="loading-block-spinner" aria-hidden />
                        <p className="loading-block-text">{label}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
