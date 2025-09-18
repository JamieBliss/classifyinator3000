import { useState } from 'react'
import { Button } from './button'
import { ChevronsUpDown } from 'lucide-react'
import { Collapsible, CollapsibleContent } from './collapsible'
import type { useClassificationData } from '@/hooks/use-classification-data'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

type ClassificationData = ReturnType<typeof useClassificationData>

interface ClassificationDetailsProps {
  selectedClassification: ClassificationData['selectedClassification']
}

export const ClassificationDetails = ({
  selectedClassification,
}: ClassificationDetailsProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-medium">Classification File Details</h3>
          <p className="text-sm text-muted-foreground pb-1">
            A deep dive into the file processing and classifications
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronsUpDown />
          <span className="sr-only">Toggle</span>
        </Button>
      </div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          {selectedClassification ? (
            <ScrollArea className="h-[400px] rounded-md border p-4 bg-muted/50">
              {selectedClassification.file_classification_chunks.map(
                (chunk) => {
                  const chartColor = chunk.chunk_classification_label
                    .toLowerCase()
                    .replace(/ /g, '-')
                  return (
                    <div
                      key={chunk.id}
                      className={`font-mono text-sm py-1 px-2 text-white my-2 w-fit rounded-md bg-secondary border-l-6`}
                      style={{
                        borderLeftColor: `var(--chart-${chartColor})`,
                      }}
                    >
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          {chunk.chunk}
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center">
                          <div
                            style={{
                              backgroundColor: `var(--chart-${chartColor})`,
                              height: '1.5em',
                              width: '1.5em',
                              borderRadius: '20%',
                              display: 'inline-block',
                              marginRight: '0.5em',
                            }}
                          ></div>
                          <span>
                            {chunk.chunk_classification_label}:{' '}
                            {Math.round(chunk.chunk_classification_score * 100)}
                            %
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )
                },
              )}
            </ScrollArea>
          ) : (
            <div className="mt-4">No classification selected.</div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
