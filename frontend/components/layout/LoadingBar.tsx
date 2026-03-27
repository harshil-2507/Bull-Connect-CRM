"use client"

import { useIsFetching } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"

export default function LoadingBar() {
  const isFetching = useIsFetching()

  return (
    <AnimatePresence>
      {isFetching > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-1"
        >
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: "0%" }}
            animate={{ 
              width: ["0%", "30%", "60%", "90%"],
              transition: { 
                duration: 2,
                times: [0, 0.2, 0.5, 0.8],
                repeat: Infinity,
                ease: "linear"
              }
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
