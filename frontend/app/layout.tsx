import "./globals.css"
import { ReactQueryProvider } from "@/providers/ReactQueryProvider"
import { ThemeProvider } from "next-themes"
import LoadingBar from "@/components/layout/LoadingBar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ReactQueryProvider>
            <LoadingBar />
            {children}
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}