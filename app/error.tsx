'use client';
export default function Error({reset}:{reset:()=>void}){return <main className="empty"><h1>A moment, please.</h1><p>We could not load this page. Check your connection and try again.</p><button className="button" onClick={reset}>Try again</button></main>}
