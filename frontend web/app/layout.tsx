import "./globals.css"
import { ReactQueryProvider } from "@/providers/ReactQueryProvider"
import { ThemeProvider } from "next-themes"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}