import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface BulkActionToolbarProps {
  selectedCount: number
  onClear: () => void
  children: React.ReactNode
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  children,
}: BulkActionToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <Card className="shadow-lg border-2 border-primary/20">
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  {selectedCount}
                </div>
                <span className="font-medium text-sm">
                  {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
                </span>
              </div>

              <div className="h-6 w-px bg-border" />

              <div className="flex items-center gap-2">
                {children}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="ml-2"
              >
                <X size={16} />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
