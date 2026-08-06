import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Temaş Kataloğu",description:"Temaş Gıda kurumsal görsel kataloğu"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}
