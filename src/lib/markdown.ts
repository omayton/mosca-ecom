// Renderer markdown mínimo e seguro (sem dependências).
// Escapa HTML primeiro, depois aplica formatação básica:
// títulos (#, ##, ###), negrito (**), itálico (*), links, imagens,
// listas (-, *), citação (>), régua (---), e parágrafos.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// Aplica formatação inline em texto já escapado.
function inline(text: string): string {
  return text
    // imagens ![alt](url)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    // links [texto](url)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // negrito **
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // itálico *
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    // código inline `
    .replace(/`([^`]+)`/g, "<code>$1</code>")
}

export function renderMarkdown(md: string): string {
  if (!md) return ""
  const lines = escapeHtml(md).split(/\r?\n/)
  const html: string[] = []
  let inUl = false
  let inOl = false
  let paragraph: string[] = []

  const closeLists = () => {
    if (inUl) { html.push("</ul>"); inUl = false }
    if (inOl) { html.push("</ol>"); inOl = false }
  }
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      html.push(`<p>${inline(paragraph.join(" "))}</p>`)
      paragraph = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.trim() === "") {
      flushParagraph()
      closeLists()
      continue
    }

    // Régua
    if (/^---+\s*$/.test(line)) {
      flushParagraph()
      closeLists()
      html.push('<hr class="my-6 border-zinc-200" />')
      continue
    }

    // Citação
    if (/^>\s?/.test(line)) {
      flushParagraph()
      closeLists()
      html.push(`<blockquote class="border-l-4 border-red-500 pl-4 italic text-zinc-600 my-4">${inline(line.replace(/^>\s?/, ""))}</blockquote>`)
      continue
    }

    // Títulos
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushParagraph()
      closeLists()
      const level = h[1].length
      const sizes = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-base"]
      html.push(`<h${level} class="font-bold text-zinc-900 mt-8 mb-3 ${sizes[level - 1]}">${inline(h[2])}</h${level}>`)
      continue
    }

    // Lista ordenada
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph()
      if (inUl) { html.push("</ul>"); inUl = false }
      if (!inOl) { html.push('<ol class="list-decimal pl-6 my-4 space-y-1.5 text-zinc-700">'); inOl = true }
      html.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`)
      continue
    }

    // Lista não-ordenada
    if (/^[-*]\s+/.test(line)) {
      flushParagraph()
      if (inOl) { html.push("</ol>"); inOl = false }
      if (!inUl) { html.push('<ul class="list-disc pl-6 my-4 space-y-1.5 text-zinc-700">'); inUl = true }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`)
      continue
    }

    // Parágrafo (acumula linhas consecutivas)
    closeLists()
    paragraph.push(line)
  }

  flushParagraph()
  closeLists()

  return html.join("\n")
}
