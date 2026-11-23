"use client";

import { useState } from "react";
import type { CodePanelData, HighlightedFile } from "../data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CodeBlock } from "@/components/ui/code-block";
import { Tabs, TabsItem } from "@/components/ui/tabs";

function Highlighted({ file }: { file: HighlightedFile }) {
  return (
    <CodeBlock code={file.code} language={file.lang} hideHeader maxHeight={420} className="rounded-3xl bg-inset">
      <div dangerouslySetInnerHTML={{ __html: file.html }} />
    </CodeBlock>
  );
}

export function CodePanel({ code }: { code: CodePanelData }) {
  const [fileIndex, setFileIndex] = useState(0);
  const file = code.files[fileIndex];

  return (
    <Accordion type="multiple" defaultValue={["code"]} className="flex w-full flex-col gap-2">
      <AccordionItem value="install" className="rounded-3xl bg-inset">
        <AccordionTrigger>Install</AccordionTrigger>
        <AccordionContent>
          <Highlighted file={code.install} />
        </AccordionContent>
      </AccordionItem>

      {code.usage && (
        <AccordionItem value="usage" className="rounded-3xl bg-inset">
          <AccordionTrigger>Usage</AccordionTrigger>
          <AccordionContent>
            <Highlighted file={code.usage} />
          </AccordionContent>
        </AccordionItem>
      )}

      {file && (
        <AccordionItem value="code" className="rounded-3xl bg-inset">
          <AccordionTrigger>Code</AccordionTrigger>
          <AccordionContent>
            {code.files.length > 1 && (
              <div className="px-3 pb-2">
                <Tabs size="compact" selectedIndex={fileIndex} onSelect={setFileIndex} idPrefix="lab-files" aria-label="Files">
                  {code.files.map((f, i) => (
                    <TabsItem key={f.name} index={i} label={f.name.split(".").pop() ?? f.name} />
                  ))}
                </Tabs>
              </div>
            )}
            <Highlighted file={file} />
          </AccordionContent>
        </AccordionItem>
      )}

      {code.howItWorks && (
        <AccordionItem value="how" className="rounded-3xl bg-inset">
          <AccordionTrigger>How it works</AccordionTrigger>
          <AccordionContent>
            <div className="typeset px-4 pb-4" dangerouslySetInnerHTML={{ __html: code.howItWorks }} />
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
