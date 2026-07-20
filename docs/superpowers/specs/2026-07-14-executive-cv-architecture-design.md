# Executive Career Experience — Fase 1: Arquitetura & Design System

Data: 2026-07-14
Status: Aprovado (aguardando revisão final do usuário)

## Contexto

Este projeto constrói um "Executive Career Experience" — um CV de nova geração no formato de site, guiado pelo Project Blueprint v3 fornecido pelo usuário (ver histórico da conversa). O blueprint descreve um projeto amplo demais para uma única spec: arquitetura, design system, conteúdo real de carreira (cases, métricas, depoimentos) e áudios narrados em 3 idiomas.

Este documento cobre **apenas a Fase 1**: a arquitetura e o design system, construídos com conteúdo placeholder. O conteúdo real (Fase 2) será especificado separadamente, uma vez que dependa de material que só o usuário possui (histórico de carreira, métricas reais, textos de case, gravações de áudio).

## Escopo da Fase 1

**Entra:**
- Estrutura de arquivos multi-página estática (sem build step, sem backend)
- Design system completo (paleta, tipografia, espaçamento, animações, componentes reutilizáveis)
- Sistema de i18n (EN/PT/ES) via JSON + troca de idioma em runtime, sem reload de página
- Mecanismo de Guided Experience local (player de áudio + cue points + scroll sync + destaque visual), validado dentro da página Career
- Landing Page completa e funcional
- Página **Career** completa como template de referência, com uma empresa de exemplo (persona 100% fictícia)
- Navegação principal com as 8 seções do blueprint (Who I Am, Career, Impact, Case Studies, How I Think, Career Inflection Points, Recommendations, Let's Talk) — links para páginas ainda não construídas apontam para placeholders "em construção"

**Não entra (Fase 2 — Conteúdo, spec separada):**
- Áudios reais (grafação/roteiro) — usa-se 1 arquivo placeholder reaproveitado
- Conteúdo real de carreira, cases, métricas, depoimentos, foto profissional
- Guided Experience multi-página (jornada completa atravessando todas as seções do site) — será construída de uma vez só, quando todas as páginas existirem
- Demais páginas do blueprint além de Landing + Career

## Estrutura de arquivos

```
/
├── index.html                   → Landing Page
├── career.html                  → Página Career (template de referência)
├── /assets
│   ├── /css
│   │   └── main.css             → Design system + componentes (compartilhado por todas as páginas)
│   ├── /js
│   │   ├── i18n.js              → Carrega JSON do idioma ativo, injeta texto no DOM
│   │   ├── guided-experience.js → Player de áudio + leitura de cues + scroll sync + highlight
│   │   └── nav.js                → Menu principal, estado de página ativa
│   ├── /audio
│   │   └── placeholder.mp3      → Áudio placeholder reaproveitado (mesmo arquivo para os 3 idiomas nesta fase)
│   ├── /i18n
│   │   ├── en.json               → Um único dicionário por idioma, estruturado por chave de página
│   │   ├── pt.json
│   │   └── es.json
│   └── /cues
│       └── career.cues.json     → Cue points da página Career
└── docs/superpowers/specs/      → Specs deste projeto
```

Cada JSON de idioma é um único arquivo (não um arquivo por página x idioma), estruturado por namespace: `{ "nav": {...}, "landing": {...}, "career": {...} }`. Isso mantém 3 arquivos totais independentemente de quantas páginas o site venha a ter.

## Design System

**Paleta** — extremamente neutra, conforme blueprint:
- Branco `#FFFFFF`, preto `#0A0A0A`, 4-5 tons de cinza intermediários para texto secundário/bordas/backgrounds sutis
- Um único azul de interação (links, foco, botão primário, estado ativo)
- Sem cores decorativas adicionais

**Tipografia:**
- Uma família sans-serif de alta qualidade (ex: Inter ou system-ui como fallback), sem custo de licenciamento
- No máximo 2 pesos de fonte (regular + semibold)
- Hierarquia clara, corpo de texto confortável (~18px)

**Espaçamento:**
- Grid em múltiplos de 8px
- Muito whitespace vertical entre seções

**Componentes reutilizáveis:**
- Cabeçalho de navegação fixo, minimalista, com seletor de idioma (🌐 EN/PT/ES) no canto superior direito
- Cartão de evidência com estrutura fixa (título + rótulos de seção + botão de áudio) — usado em Career e reaproveitável em Case Studies/Impact na Fase 2
- Player de áudio (play/pause, avançar/voltar, barra de progresso, tempo restante) — componente único reaproveitado em toda a Guided Experience
- Botão primário e botão secundário (2 variantes apenas)

**Animações:** transições de opacidade/transform ≤ 300ms (fade-in ao rolar, destaque suave ao focar um bloco). Sem parallax, sem efeitos 3D, sem carrosséis, sem autoplay.

## Arquitetura de i18n

- `i18n.js` roda em todas as páginas: detecta idioma salvo em `localStorage` → senão usa `navigator.language` → senão default para EN
- Elementos de texto usam `data-i18n="career.title"`; o JS varre o DOM e substitui `textContent` pela chave correspondente do JSON do idioma ativo
- Trocar idioma no seletor re-executa a tradução sem reload de página, e persiste a escolha em `localStorage`
- Áudio por idioma: o JSON de cues referencia o caminho do arquivo de áudio daquele idioma (ex: `career.en.mp3`, `career.pt.mp3`, `career.es.mp3`); nesta fase, como só existe 1 placeholder, os três idiomas apontam para o mesmo arquivo, mas o mecanismo já suporta arquivos distintos por idioma
- Troca de idioma deve alterar **texto e áudio simultaneamente**, sem qualquer perda de qualidade gráfica ou de layout (nenhum elemento pode mudar de tamanho/posição por causa da troca de idioma — strings mais longas em outro idioma não podem quebrar o layout)

## Mecanismo da Guided Experience (local, dentro da página Career)

**Estrutura do cue file** (`career.cues.json`):
```json
[
  { "time": 0,    "target": "#career-intro",  "action": "scroll-highlight" },
  { "time": 12.5, "target": "#context-block", "action": "scroll-highlight" },
  { "time": 28,   "target": "#impact-chart",  "action": "scroll-highlight" }
]
```

**Fluxo:**
1. Visitante clica em **"Audio Guide"** (rótulo definido — não "Start Guided Experience", que soa formal/pomposo demais) → player de áudio aparece fixo (barra discreta)
2. Ao dar Play, o `<audio>` inicia e o listener de `timeupdate` verifica se `currentTime` ultrapassou o próximo cue
3. Ao atingir um cue: `element.scrollIntoView({behavior:'smooth', block:'center'})` + classe CSS `.is-focused` no elemento alvo (destaque sutil — opacidade/sombra, sem piscar ou girar), removendo `.is-focused` do elemento anterior
4. Controles manuais (Play/Pause/Avançar/Voltar/barra de progresso/tempo restante) têm prioridade sobre o avanço automático: arrastar a barra recalcula o cue ativo a partir do novo tempo; pausar interrompe o acompanhamento do scroll até retomar o play
5. Avançar/Voltar pulam para o cue seguinte/anterior (não ±N segundos fixos), já que cada cue representa um bloco de conteúdo completo
6. Trocar de idioma durante a reprodução troca o arquivo de áudio e retoma no mesmo `currentTime` — os tempos dos cues não mudam, apenas o arquivo de áudio e o texto exibido

**Fora de escopo nesta fase:** o botão "Audio Guide" da Landing Page fica visualmente presente, porém **sem função** — a Guided Experience multi-página (que atravessa todas as seções do site) será construída de uma vez só, numa fase futura, quando todas as páginas existirem.

## Landing Page

- Header fixo: nome à esquerda, seletor de idioma (🌐) à direita
- Hero: foto placeholder (elemento neutro, com nota indicando "foto profissional" a ser substituída na Fase 2), nome, cargo, resumo de 3 linhas
- Botões: **Audio Guide** (primário, sem função nesta fase) / Explore Freely (rola suavemente até a navegação/seções) / Download Executive Resume / Download ATS Resume — mais link para LinkedIn

## Página Career (template de referência)

- Um único bloco (empresa fictícia) com a estrutura fixa do blueprint: **Context → Challenge → Actions → Impact → Lessons → Evidence → Audio Commentary**
- Cada subtítulo é uma `<section>` com `data-i18n`, provando que a estrutura se repete de forma idêntica para futuras empresas (a Fase 2 duplica o bloco)
- Botão "Audio Guide" no topo do bloco ativa o player local + cues específicos desta página (este é o botão funcional que valida o mecanismo)
- "Evidence" é um placeholder visual simples (caixa neutra com rótulo indicando o tipo de evidência) — vira imagem/link real na Fase 2

## Conteúdo placeholder

Persona 100% fictícia (nome, cargo e empresa inventados, ex.: "Alex Morgan, Chief Strategy Officer" / empresa "Empresa X"), deixando claro que esta fase é uma prova estrutural, sem vínculo com dados reais do usuário.

## Verificação

Sem testes automatizados — não há lógica de negócio complexa o bastante para justificar suíte de testes nesta fase. Verificação manual no navegador, cobrindo:
- Troca de idioma: texto e áudio mudam juntos, sem reload e sem quebra de layout em nenhum dos 3 idiomas
- Player: play/pause/avançar/voltar/arrastar barra de progresso — scroll e destaque acompanham corretamente os cues em cada caso
- Responsividade básica em mobile e desktop

## Fora de escopo / decisões adiadas

- Conteúdo real de qualquer página (Fase 2, spec separada)
- Áudios reais / roteiros de narração (Fase 2)
- Páginas além de Landing e Career (Fase 2, reaproveitando os padrões validados aqui)
- Guided Experience multi-página (fase futura, após todas as páginas existirem)
- Controle de versão: este diretório de trabalho não é um repositório git; a spec foi salva em disco mas não commitada
