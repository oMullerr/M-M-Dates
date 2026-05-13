# 🍕 Snack Budget

Controle de gastos com dates para casais. Frontend puro em Angular 18 + Angular Material, com dados salvos no **localStorage do navegador** — nada de backend, nada de banco de dados, nada de configurar servidor.

---

## ⚡ Como rodar

### Pré-requisito
- **[Node.js 18 ou superior](https://nodejs.org/)** instalado.

### Passos (3 minutos)

```bash
# 1. Extrair o projeto (caso ainda não tenha feito)
# 2. Abrir a pasta
cd snack-budget

# 3. Instalar dependências
npm install

# 4. Rodar
npm start
```

O app abre automaticamente em **http://localhost:4200**.

### Pelo VS Code

1. **Abrir a pasta** `snack-budget` no VS Code (`File → Open Folder...`)
2. O VS Code vai sugerir instalar a extensão **Angular Language Service** — aceite.
3. Abrir o terminal integrado (`` Ctrl+` ``) e rodar `npm install`.
4. Pressionar `Cmd/Ctrl + Shift + B` → escolher **Snack Budget · start**.

Pronto. O app sobe e abre no navegador.

---

## ☁️ Deploy no Vercel (1 minuto)

### Opção A — Via GitHub (recomendado)

1. Suba o projeto para um repositório do GitHub.
2. Vá para [vercel.com/new](https://vercel.com/new), conecte o GitHub e importe o repositório.
3. O Vercel detecta o Angular automaticamente. O `vercel.json` já está configurado — clique em **Deploy**.

### Opção B — Via Vercel CLI

```bash
# Instalar a CLI uma vez
npm install -g vercel

# Dentro da pasta do projeto
vercel
```

A CLI faz algumas perguntas, deixa as respostas no padrão (`enter`) e em ~1 minuto o app está no ar com uma URL `.vercel.app`.

### O que o `vercel.json` faz

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist/snack-budget/browser` (onde o Angular 18 cospe os arquivos)
- `rewrites`: manda toda rota desconhecida para `index.html` (essencial para Angular Router funcionar com rotas tipo `/expenses` e `/settings`)

---

## ✨ Features

- **📊 Dashboard** com gráficos reativos (progresso do mês, doughnut por forma de pagamento, barras por pessoa, linha cumulativa)
- **🧾 Tela de Gastos** com busca, filtros, ordenação, editar e excluir
- **⚙️ Configurações** para mudar o budget mensal e gerenciar formas de pagamento (com seletor de cor)
- **🌗 Light & Dark mode** com detecção da preferência do sistema
- **📅 Filtro de mês** persistente no topo de todas as telas — navegue por qualquer mês
- **🔄 Reset mensal automático** — o budget é calculado por mês, sem job agendado
- **📋 Mensagem pronta para WhatsApp** copiada com um clique
- **📱 Mobile-first** com FAB e sidenav em drawer

### Modelo da mensagem

```
Oh o lanchinho!! 🍕🍔🍟
Data: 10/05/2026
Local: Sushi Yamato
Valor: R$ 198,40
Forma de pagamento: Flash Mari
Budget Mari restante: R$ 343,80
Budget Math restante: R$ 679,50
Budget total restante: R$ 1023,30
```

---

## 💾 Como funcionam os dados

Tudo fica salvo no **localStorage do próprio navegador**, em duas chaves:

- `snack-budget.expenses` — lista de gastos
- `snack-budget.settings` — budget mensal + formas de pagamento

Na primeira vez que o app abre, ele popula essas chaves com dados de exemplo (definidos em `StorageService.SEED`).

### Implicações

✅ **Sem servidor, sem custos, deploy estático no Vercel**
✅ **Funciona offline** depois de carregado
✅ **Cada um tem seu próprio "banco"** — Math vê os dele, Mari vê os dela
⚠️ Trocar de navegador/celular = começa do zero (mas dá para exportar o JSON do DevTools se precisar)
⚠️ Limpar dados do navegador apaga tudo

> Se mais para frente quiserem sincronizar entre celulares, é só trocar o `StorageService` por um cliente Firebase/Supabase. O resto do código não muda.

---

## 🗂️ Estrutura

```
snack-budget/
├── .vscode/                            # Configs do VS Code (tasks, launch, extensões)
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/                 # Tipos de domínio
│   │   │   └── services/
│   │   │       ├── storage.service.ts  # ← localStorage + seed
│   │   │       ├── expense.service.ts
│   │   │       ├── settings.service.ts
│   │   │       ├── month-filter.service.ts
│   │   │       ├── theme.service.ts
│   │   │       └── toast.service.ts
│   │   ├── features/
│   │   │   ├── dashboard/              # Gráficos, resumo, últimos
│   │   │   ├── expenses/               # Lista filtrável com CRUD
│   │   │   └── settings/               # Budget, formas de pagamento, tema
│   │   ├── layout/
│   │   │   └── shell.component.ts      # Sidenav + toolbar
│   │   ├── shared/
│   │   │   ├── components/             # Dialogs, filtro de mês
│   │   │   └── pipes/                  # BrlPipe
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## 🛠️ Scripts

| Comando         | O que faz                                  |
|-----------------|--------------------------------------------|
| `npm start`     | Roda em modo desenvolvimento (http://localhost:4200) |
| `npm run build` | Build de produção em `dist/snack-budget/browser` |
| `npm run watch` | Build em modo watch                        |

---

## 🎨 Stack

- **Angular 18 standalone** + nova sintaxe de control flow (`@if`, `@for`)
- **Angular Material 18** com M3 theming (`define-theme` + `all-component-themes`)
- **Signals + computed** para reatividade fina
- **ChangeDetectionStrategy.OnPush** em tudo
- **Lazy-loaded routes**
- **ng2-charts + chart.js 4** para gráficos
- **localStorage** como persistência

---

Feito com 💕 para Math & Mari.
