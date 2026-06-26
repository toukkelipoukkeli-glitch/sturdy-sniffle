import { CNC_CALCULATOR_VERSION, type CncQuoteInput, type CncQuoteResult } from "../quoting/cnc"
import { calculateQuote } from "../quoting/registry"

export function calculateWorkspaceCncQuote(input: CncQuoteInput): CncQuoteResult {
  const quote = calculateQuote({ process: input.process, input })
  return {
    ...quote,
    calculatorVersion: CNC_CALCULATOR_VERSION,
    process: input.process,
  }
}
