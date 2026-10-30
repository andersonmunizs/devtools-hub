export const TEXT_INPUT_LIMIT_BYTES = 1_048_576;
const encoder = new TextEncoder();

// UTF-16 length is a lower bound on UTF-8 bytes; avoid oversized allocations.
export function getTextInputSize(input: string): number | null {
  return input.length > TEXT_INPUT_LIMIT_BYTES
    ? null
    : encoder.encode(input).byteLength;
}
