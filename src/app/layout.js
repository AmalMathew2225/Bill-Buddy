import { Inter } from "next/font/google";
// import "./globals.css"; // Temporarily disabled due to CSS build issue

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Bill Buddy - AI Agent",
  description: "Receipt to Wallet Pass Agent",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          * {
            box-sizing: border-box;
            padding: 0;
            margin: 0;
          }
          html, body {
            background-color: #0f172a;
            color: #f8fafc;
            font-family: ${inter.style.fontFamily}, system-ui, -apple-system, sans-serif;
            height: 100%;
            max-width: 100vw;
            overflow-x: hidden;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
          }
          .glass-panel {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 16px;
            backdrop-filter: blur(10px);
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(148, 163, 184, 0.1);
            border-top-color: #8b5cf6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .title-gradient {
            background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .delete-btn:hover {
            background: rgba(239, 68, 68, 0.2) !important;
            transform: scale(1.05);
          }
          input, button {
            font-family: inherit;
          }
        `}</style>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
