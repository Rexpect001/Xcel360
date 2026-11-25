/**
 * Structured data for search engines. Always use this instead of a raw
 * JSON.stringify inside <script>: listing text comes from admins, the poster
 * tool and auto-discovery, and a "</script>" in a title or description would
 * otherwise end the tag and run whatever follows as JavaScript.
 */
const LINE_SEPARATORS = new RegExp('[\\u2028\\u2029]', 'g')

export function serializeJsonLd(data: object | object[]): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATORS, (c) => (c === ' ' ? '\\u2028' : '\\u2029'))
}

export default function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}
