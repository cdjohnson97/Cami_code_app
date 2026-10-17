// Cosmetic syntax highlighter for the pseudocode DSL and the Python subset — ported verbatim
// from the original app (pure function, no DOM dependency, trivial to carry over as-is).

const KEYWORDS: Record<string, string[]> = {
  pseudo: ["SI","ALORS","SINON","SINONSI","FINSI","TANTQUE","TANT","QUE","FINTANTQUE","POUR","DE","A","PAS","FINPOUR","FONCTION","RETOURNER","FINFONCTION","VRAI","FAUX","RIEN","ET","OU","NON","VARIABLE","AFFICHER"],
  python: ["def","if","elif","else","while","for","in","range","return","True","False","None","and","or","not","print","class","break","continue","self","import"],
};

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightCode(code: string, lang: string): string {
  const kws = KEYWORDS[lang] || [];
  const kwSet = new Set(kws);
  const lines = code.split("\n");
  return lines
    .map((line) => {
      let out = "";
      let i = 0;
      const n = line.length;
      while (i < n) {
        const c = line[i];
        if (c === "#") {
          out += `<span class="tok-com">${escapeHtml(line.slice(i))}</span>`;
          break;
        }
        if (c === '"' || c === "'") {
          const q = c;
          let j = i + 1;
          while (j < n && line[j] !== q) {
            if (line[j] === "\\") j++;
            j++;
          }
          const seg = line.slice(i, Math.min(j + 1, n));
          out += `<span class="tok-str">${escapeHtml(seg)}</span>`;
          i = j + 1;
          continue;
        }
        if (/[0-9]/.test(c)) {
          let j = i;
          while (j < n && /[0-9.]/.test(line[j])) j++;
          out += `<span class="tok-num">${escapeHtml(line.slice(i, j))}</span>`;
          i = j;
          continue;
        }
        if (/[A-Za-zÀ-ÖØ-öø-ÿ_]/.test(c)) {
          let j = i;
          while (j < n && /[A-Za-zÀ-ÖØ-öø-ÿ0-9_]/.test(line[j])) j++;
          const word = line.slice(i, j);
          if (kwSet.has(word)) out += `<span class="tok-kw">${escapeHtml(word)}</span>`;
          else if (line[j] === "(") out += `<span class="tok-fn">${escapeHtml(word)}</span>`;
          else out += escapeHtml(word);
          i = j;
          continue;
        }
        out += escapeHtml(c);
        i++;
      }
      return out || " ";
    })
    .join("\n");
}
