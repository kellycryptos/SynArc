'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  // Group documentation routes under a shared key so navigating between doc sections
  // does not tear down the layout, unmount the sidebar, or cause exit animation latency.
  const routeKey = pathname.startsWith('/docs') ? '/docs' : pathname
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
