export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="glass-panel p-8 flex flex-col items-center gap-4">
                <div className="spinner"></div>
                <p className="text-slate-400 animate-pulse">Loading Bill Buddy...</p>
            </div>
        </div>
    );
}
