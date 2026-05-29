'use client'

import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export const AnimatedNumber = ({ value, decimals = 0 }: { value: number, decimals?: number }) => {
  const spring = useSpring(0, { duration: 1200, bounce: 0 })
  const display = useTransform(spring, (val) => 
    val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  )

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}
