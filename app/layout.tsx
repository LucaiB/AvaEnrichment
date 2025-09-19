import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Ava Enrichments",
  description: "Minimal enrichment chatbot with Bedrock and Tavily web search."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
