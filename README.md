# 🍕 M&M Dates

Controle de gastos de dates para casais. Frontend em **Angular 18 + Angular Material**, dados sincronizados em tempo real via **Firebase Firestore**, autenticação por email/senha. Instalável como **PWA** (Progressive Web App) — vira app de verdade no celular, sem App Store/Play Store.

Os dois celulares enxergam os mesmos dados — você lança um gasto, e em ~1 segundo aparece no celular do(a) seu(sua) par.

---

## 📚 Índice

1. [TL;DR](#-tldr--rodar-local)
2. [Configurar Firebase](#-configurar-firebase-5-minutos-plano-gratuito)
3. [Deploy no Vercel](#️-deploy-no-vercel)
4. [Instalar como app no iPhone](#-instalar-como-app-no-iphone)
5. [Instalar como app no Android](#-instalar-como-app-no-android)
6. [Testar e debugar o PWA](#-testar-e-debugar-o-pwa)
7. [Como funcionam atualizações](#-como-funcionam-as-atualizações-do-app)
8. [Resolução de problemas](#️-resolução-de-problemas)
9. [Features](#-features)
10. [Estrutura](#️-estrutura)
11. [FAQ](#-faq)

---

## ⚡ TL;DR — rodar local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Firebase (uma vez só — passo a passo na próxima seção)
#    Cole sua firebaseConfig em src/environments/environment.ts

# 3. Rodar em modo desenvolvimento
npm start
```

App abre em http://localhost:4200.

> ⚠️ **Em desenvolvimento o service worker fica desligado de propósito.** Isso é normal e correto — você não quer cache atrapalhando enquanto edita código. Para testar o PWA de verdade (instalação, offline, etc.), use `npm run preview:pwa` (veja a seção [Testar e debugar o PWA](#-testar-e-debugar-o-pwa)).

---

## 🔥 Configurar Firebase (5 minutos, plano gratuito)

### 1. Criar projeto no Firebase

1. Vá em https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: qualquer um (ex: `mm-dates`)
4. **Desative o Google Analytics** (não precisa)
5. Clique em "Criar projeto" e aguarde

### 2. Ativar Authentication (email/senha)

1. No menu lateral, vá em **Build → Authentication**
2. Clique em **"Vamos começar"**
3. Aba **"Sign-in method"** → clique em **"Email/senha"**
4. Ative o primeiro toggle (Email/Senha). Deixe o segundo (link de email) desativado.
5. Clique em **"Salvar"**

### 3. Criar Firestore Database

1. No menu lateral, vá em **Build → Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Modo: **"Modo de produção"**
4. Localização: escolha uma próxima, ex: `southamerica-east1` (São Paulo)
5. Clique em **"Ativar"**

### 4. Aplicar regras de segurança

1. Ainda em Firestore, clique na aba **"Regras"**
2. Apague tudo e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update, delete: if request.auth.uid == userId;
    }

    match /couples/{coupleId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null;

      match /{document=**} {
        allow read, write: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/couples/$(coupleId)).data.memberUids;
      }
    }
  }
}
```

3. Clique em **"Publicar"**

### 5. Pegar as credenciais

1. **Configurações do projeto** (engrenagem ⚙️) → aba **"Geral"**
2. Role até **"Seus apps"** → clique no ícone Web `</>`
3. Apelido: qualquer (ex: `mm-dates-web`)
4. **Desmarque** "Configurar o Firebase Hosting"
5. Clique em **"Registrar app"**
6. **Copie o objeto `firebaseConfig`** que aparece

### 6. Colar no projeto

Abra **`src/environments/environment.ts`** e **`src/environments/environment.production.ts`** e substitua os placeholders pelos valores reais. **Os dois arquivos** — o de produção é o que vai pro Vercel.

### 7. Rodar

```bash
npm install
npm start
```

Crie sua conta. Deixe **"Código do casal"** vazio na primeira vez (você cria o casal). Depois copie o código em **Configurações → Compartilhar com seu par** e mande pra sua/seu par usar no signup dele(a).

---

## ☁️ Deploy no Vercel

### Opção A — via GitHub (recomendado)

1. Suba o projeto pra um repo no GitHub
2. Em https://vercel.com/new, conecte o GitHub e importe o repositório
3. O Vercel detecta o `vercel.json` automaticamente. Clique em **"Deploy"**

> O Vercel já está pré-configurado pra build do Angular + roteamento SPA + headers do PWA (service worker e manifest).

### Opção B — via CLI

```bash
npm install -g vercel
vercel
```

### ⚠️ DEPOIS do primeiro deploy: adicionar o domínio no Firebase

Senão o login dá erro de "domínio não autorizado":

1. Vá no console do Firebase → **Authentication → Settings → Authorized domains**
2. Clique em **"Add domain"**
3. Cole o domínio do Vercel (algo como `seu-projeto.vercel.app`)
4. Se você for usar domínio próprio depois, adicione esse também

### O que o `vercel.json` faz automaticamente

- Build com `npm run build`
- Output em `dist/mm-dates/browser`
- Rewrites para Angular Router (qualquer rota cai em `/index.html`)
- **Headers críticos para o PWA**:
  - `ngsw-worker.js` com `Cache-Control: no-cache` — **essencial** pra atualizações chegarem
  - `manifest.webmanifest` com `Content-Type: application/manifest+json`
  - Ícones com `Cache-Control: immutable` (1 ano de cache)
  - `Service-Worker-Allowed: /` no service worker

---

## 📱 Instalar como app no iPhone

> Funciona no iOS 16.4+ e iPadOS 16.4+. Em iOS mais antigo funciona também, com algumas limitações.

1. Abra o app no **Safari** (não Chrome, Firefox ou outro navegador)
2. Toque no ícone **Compartilhar** (quadrado com seta pra cima, no rodapé)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. (Opcional) Edite o nome — vai aparecer como **M&M Dates** por padrão
5. Toque em **"Adicionar"** no canto superior direito

Pronto. O ícone 🍕 aparece na tela inicial igualzinho a um app nativo. Ao tocar:

- ✅ Abre **em tela cheia** (sem a barra do Safari)
- ✅ Aparece no **switcher de apps** do iOS
- ✅ Funciona **offline** (depois da primeira carga)
- ⚠️ **Login persiste** mas se ficar muito tempo sem usar (~7 dias), o iOS pode limpar e você loga de novo
- ⚠️ Notificações push **funcionam só no iOS 16.4+** (não foram implementadas nesse app, mas dá pra adicionar depois)

### 💡 Dica para iPhone

Antes de instalar, faça login no Safari uma vez. A sessão fica salva e o app instalado abre direto na tela do dashboard.

---

## 🤖 Instalar como app no Android

### Modo 1: Pelo prompt automático do app

Quando você abre o app no Chrome/Edge/Samsung Internet, depois de alguns segundos navegando, **aparece um botão "Instalar app"** na barra lateral do app. Toque nele e o Android instala automaticamente.

### Modo 2: Pelo menu do navegador

1. Abra o app no **Chrome** (ou Edge, Samsung Internet, Brave — qualquer baseado em Chromium)
2. Toque nos **três pontinhos** (⋮) no canto superior direito
3. Toque em **"Instalar app"** ou **"Adicionar à tela inicial"**
4. Confirme

O Android instala como app real:

- ✅ Aparece no **drawer de apps** (lista de todos os apps)
- ✅ Abre **em tela cheia**
- ✅ Funciona **offline**
- ✅ Aparece no histórico de apps recentes
- ✅ Pode ser desinstalado normalmente (segurar ícone → desinstalar)

### Modo 3: Firefox Android

1. Abra no Firefox
2. Toque nos três pontinhos
3. **"Instalar"** (versões recentes) ou **"Adicionar à tela inicial"** (versões antigas)

---

## 🧪 Testar e debugar o PWA

### Em desenvolvimento (`npm start`)

O service worker fica **desligado** em dev. Tudo que dá pra testar nesse modo é:
- Layout responsivo (DevTools → toggle device toolbar)
- Lógica do app, formulários, gráficos
- Firebase (auth + Firestore sincronizam normalmente)

**Não dá pra testar**: instalação, comportamento offline, atualização do app.

### Em modo PWA local (`npm run preview:pwa`)

Esse comando faz build de produção **completo** + serve em `http://localhost:8080` com `http-server`. Aí o service worker liga e você consegue testar tudo:

```bash
npm run preview:pwa
```

#### Checklist do PWA no Chrome DevTools

1. Abrir `http://localhost:8080` no **Chrome**
2. **F12** → **Application** (aba)
3. Em **Manifest**:
   - Confere se aparece "M&M Dates" como name
   - Confere se os ícones estão todos verdes (não deve ter aviso)
4. Em **Service Workers**:
   - Confere se há um worker registrado e em "activated and is running"
   - Marque ✅ **"Update on reload"** (útil durante testes)
5. Em **Cache Storage**:
   - Deve aparecer um cache `ngsw:` com seus assets
6. Aba **Lighthouse** → rodar audit **"Progressive Web App"**:
   - Deve dar **score 100** (ou próximo)
   - Critérios atendidos: HTTPS (em produção), manifest válido, ícones, service worker, viewport, theme color, offline fallback

#### Testar offline

Com o app aberto no Chrome:
1. **DevTools → Network → Throttling: Offline**
2. Recarregue a página (F5)
3. O app **deve continuar funcionando** (interface)
4. Operações novas (criar gasto) **falham** porque Firestore precisa de internet — mas o Firestore SDK enfilera tudo e sincroniza quando voltar

#### Testar instalação no Chrome desktop

1. Com o app aberto em `http://localhost:8080`
2. Olhe na **barra de endereço** — aparece um ícone de "Instalar" (monitor com seta ↓)
3. Clique nele → "Instalar"
4. O app abre em **janela própria** (sem chrome do navegador), aparece no menu iniciar/launchpad

#### Testar instalação no celular (dev local)

Pra abrir o `npm run preview:pwa` no seu celular dentro da mesma rede Wi-Fi:

1. Descubra o IP do seu PC: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux). Exemplo: `192.168.1.50`
2. No celular, abra: `http://192.168.1.50:8080`
3. ⚠️ **PWAs precisam de HTTPS pra instalar.** A única exceção é `http://localhost` (no próprio PC). Pelo IP não vai funcionar pra instalar — mas dá pra navegar e ver o comportamento.

Pra testar instalação no celular **antes do deploy**, a forma mais fácil é usar um túnel:

```bash
# Em outro terminal, com o preview rodando:
npx localtunnel --port 8080
# Te dá uma URL HTTPS pública (ex.: https://abc123.loca.lt)
# Cole no celular e teste instalação
```

Ou simplesmente faça deploy no Vercel — o Vercel sempre serve HTTPS.

### Em produção (Vercel)

Depois do deploy:

1. Abra o app em `https://seu-projeto.vercel.app`
2. **Espere 5 segundos** (o SW registra "when stable")
3. Confira no DevTools → Application → Service Workers que está rodando
4. Botão "Instalar app" aparece no menu lateral (Android/Chrome desktop)
5. iPhone: Safari → Compartilhar → Adicionar à Tela de Início

---

## 🔄 Como funcionam as atualizações do app

PWAs têm um comportamento que vale entender:

### Quando você faz push de nova versão

1. Você faz `git push` → Vercel rebuilda → novo `ngsw-worker.js` no ar
2. **Service worker antigo continua servindo a versão atual** pro usuário (offline-first)
3. Em background, o navegador baixa a nova versão
4. Quando termina, o `PwaService` mostra um toast:
   > *"Nova versão disponível. Recarregando em 3s..."*
5. App recarrega automaticamente com a versão nova

### Por que não é instantâneo

Service workers seguem o princípio **"offline-first"**: garantem que o app continue funcionando mesmo offline, então não fazem download/refresh agressivos. A atualização leva uns segundos a alguns minutos depending de quando o navegador agenda a verificação.

### Para forçar atualização imediata

Configurei o app pra checar a cada hora **e** quando vê o app voltar ao foco. Mas se quiser forçar manualmente:

- **iPhone**: feche o app no switcher e abra de novo. Depois de poucos segundos, o toast aparece.
- **Android/Desktop**: igual. Ou abre DevTools → Application → Service Workers → "Update".
- **Em emergência (algo quebrou)**: use a aba **Application → Storage → Clear site data** no DevTools. Limpa tudo, registra a nova versão na próxima visita.

---

## 🛠️ Resolução de problemas

### "Mudei o código mas o navegador continua mostrando o app velho"

Service worker pegou cache do build anterior. Pra resolver:

1. **DevTools → Application → Service Workers → Unregister**
2. **Application → Storage → Clear site data**
3. Hard reload (Ctrl+Shift+R / Cmd+Shift+R)
4. Ou, no celular: desinstalar o app + limpar cache do navegador

### "Login dá erro 'auth/unauthorized-domain'"

Falta adicionar o domínio do Vercel no Firebase. Vá em **Authentication → Settings → Authorized domains** e adicione.

### "Botão 'Instalar app' não aparece no Android"

Critérios do navegador pra mostrar o prompt:
- ✅ Servido em HTTPS (Vercel sempre é)
- ✅ Manifest válido e linkado no `<head>`
- ✅ Service worker registrado e respondendo a fetch events
- ✅ Ícones 192x192 e 512x512 presentes
- ⏱️ Usuário deve **navegar por alguns segundos** antes do prompt aparecer

Tudo isso já está atendido. Se ainda não aparecer, abra a aba **Lighthouse** no Chrome desktop e rode audit PWA — vai apontar qualquer coisa específica.

### "iPhone não mostra opção 'Adicionar à Tela de Início'"

Só funciona no **Safari**, não em Chrome iOS (pelas regras da Apple). Abra a URL no Safari de verdade.

### "Apareceu 'iOS Safari não suporta serviço de notificação'"

Não é o caso desse app — não usamos notificações push (por enquanto). Se aparecer, é falso positivo do Lighthouse.

### "Build local funciona, no Vercel não funciona"

Possíveis causas:
1. Falta colar firebaseConfig em `environment.production.ts` (o build de produção usa esse arquivo, não o `environment.ts`)
2. Falta autorizar domínio no Firebase
3. Variável de ambiente esquecida — esse projeto não usa nenhuma, então não é provável

---

## ✨ Features

- **🔐 Autenticação** — email/senha, sistema de "casal" (dois ou mais usuários compartilham os mesmos dados)
- **☁️ Sincronização em tempo real** — você lança um gasto e em ~1 segundo aparece no celular do(a) seu(sua) par
- **📱 PWA** — instalável no iPhone e Android, funciona offline, ícone na tela inicial
- **📊 Dashboard** com gráficos reativos (progresso do mês, doughnut por forma de pagamento, barras por pessoa, linha cumulativa)
- **🧾 Tela de Gastos** com busca, filtros, ordenação, editar e excluir
- **⚙️ Configurações** para mudar budget mensal e gerenciar formas de pagamento
- **🤝 Compartilhar casal** — código copiável para sua/seu par entrar no mesmo workspace
- **🌗 Light & Dark mode** com detecção da preferência do sistema
- **📅 Filtro de mês** persistente no topo de todas as telas
- **🔄 Reset mensal automático** — budget calculado por mês
- **📋 Mensagem pronta para WhatsApp** copiada com um clique
- **🆕 Auto-update** — versão nova é detectada e aplicada automaticamente

### Modelo da mensagem gerada

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

## 🗂️ Estrutura

```
mm-dates/
├── .vscode/                              # Configs do VS Code (tasks, launch, extensões)
├── public/
│   ├── manifest.webmanifest              # Web App Manifest (PWA)
│   ├── apple-touch-icon.png              # Ícone iOS 180x180
│   ├── favicon.ico, favicon.png          # Favicons
│   └── icons/                            # 12 PNGs (72…512) + maskable
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts         # Protege rotas
│   │   │   ├── models/
│   │   │   │   └── index.ts              # Tipos (Expense, Settings, User, Couple)
│   │   │   └── services/
│   │   │       ├── auth.service.ts       # Login, signup, signout
│   │   │       ├── firestore.service.ts  # CRUD genérico com onSnapshot
│   │   │       ├── expense.service.ts
│   │   │       ├── settings.service.ts
│   │   │       ├── month-filter.service.ts
│   │   │       ├── theme.service.ts      # Light/dark mode
│   │   │       ├── toast.service.ts
│   │   │       └── pwa.service.ts        # ✨ Update detection + install prompt
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── login.component.ts
│   │   │   ├── dashboard/
│   │   │   ├── expenses/
│   │   │   └── settings/                 # Budget, formas, compartilhar casal
│   │   ├── layout/
│   │   │   └── shell.component.ts        # Sidenav + topbar + botão "Instalar"
│   │   ├── shared/
│   │   │   ├── components/               # Dialogs, filtro de mês
│   │   │   └── pipes/
│   │   ├── app.component.ts              # Inicializa PwaService
│   │   ├── app.config.ts                 # Providers Firebase + Service Worker
│   │   └── app.routes.ts
│   ├── environments/
│   │   ├── environment.ts                # ← cole sua firebaseConfig aqui
│   │   └── environment.production.ts     # ← e aqui também
│   ├── index.html                        # Meta tags PWA (iOS + Android)
│   ├── main.ts
│   └── styles.scss
├── angular.json                          # serviceWorker habilitado em produção
├── ngsw-config.json                      # Estratégia de cache do SW
├── package.json
├── tsconfig.json
└── vercel.json                           # Headers PWA (cache control, MIME types)
```

---

## 🛠️ Scripts

| Comando                  | O que faz                                          |
|--------------------------|----------------------------------------------------|
| `npm start`              | Dev server em http://localhost:4200 (SW desligado) |
| `npm run build`          | Build de produção em `dist/mm-dates/browser`       |
| `npm run preview:pwa`    | Build + serve em http://localhost:8080 (SW ligado) |
| `npm run watch`          | Build em modo watch                                |

---

## 🎨 Stack

- **Angular 18 standalone** + nova sintaxe de control flow
- **Angular Material 18** com M3 theming (violet + rose, light/dark)
- **Firebase 10** (Authentication + Firestore) via **@angular/fire 18**
- **@angular/service-worker 18** — PWA com cache offline-first
- **Signals + computed** para reatividade fina
- **ChangeDetectionStrategy.OnPush** em tudo
- **Lazy-loaded routes**
- **ng2-charts + chart.js 4**

---

## ❓ FAQ

### "Vai mesmo aparecer como app no celular?"
Sim. Depois de instalar (passos acima), tem ícone na tela inicial, abre em tela cheia sem barra de navegador, aparece no switcher de apps. Pra usuário comum é indistinguível de um app nativo da App Store.

### "Funciona offline?"
A interface sim — o app carrega instantaneamente mesmo sem internet. Mas pra criar/editar/ver gastos novos precisa de internet, porque o Firestore é nuvem. O Firestore SDK enfileira escritas offline e sincroniza quando voltar.

### "É grátis mesmo?"
Sim. Vercel grátis (até 100 GB de tráfego/mês), Firebase grátis (50k leituras/dia, 20k escritas/dia, 1 GB storage). Pra um casal usando 50 gastos/mês, você usa < 1% disso. Não precisa colocar cartão em nenhum dos dois.

### "Como atualizo o app no celular?"
Não precisa fazer nada. Quando você dá `git push`, o Vercel rebuilda, o service worker percebe a versão nova, baixa em background e mostra um toast pedindo pra recarregar. Em ~5 segundos o app está atualizado nos dois celulares.

### "E se eu mudar de celular?"
Faça login com o mesmo email. Os dados vêm da nuvem (Firestore), o app baixa do Vercel. Tudo aparece igual.

### "Posso ter mais de duas pessoas no mesmo casal?"
Pode. O campo `memberUids` é um array — qualquer um com o código do casal pode entrar.

### "Os dados são privados?"
Sim. As regras de segurança do Firestore garantem que só os **membros de um casal** veem/editam os dados daquele casal. Mesmo que alguém pegue seu `firebaseConfig` (que está no bundle JS público, e tudo bem), não consegue ver/alterar nada sem estar autenticado e fazer parte do casal certo.

### "Por que email/senha e não Google login?"
Google login é mais fácil de implementar, mas exige configurar OAuth no Firebase + adicionar SHA fingerprints, e o iOS Safari tem caprichos com popups OAuth dentro de PWAs. Email/senha funciona em todos os ambientes sem ressalvas. Se quiser Google login depois, é só adicionar `provideAuth(() => { const auth = getAuth(); signInWithPopup(auth, new GoogleAuthProvider()); })` e ajustar.

### "Posso usar domínio próprio?"
Pode. Vercel → projeto → Settings → Domains → adiciona seu domínio. **Importante**: depois disso, **adicione o domínio em Firebase → Authentication → Authorized domains** também, senão o login para de funcionar.

### "E notificações push?"
Não estão implementadas nesse app. Dá pra adicionar usando Firebase Cloud Messaging — mas iOS Safari só suporta push em PWAs a partir do iOS 16.4 e exige instalação prévia.

---

Feito com 💕 para Math & Mari.
