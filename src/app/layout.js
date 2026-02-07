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
        `}</style>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
