# 🍕 M&M Dates

Controle de gastos de dates para casais. Frontend em **Angular 18 + Angular Material**, dados sincronizados em tempo real via **Firebase Firestore**, autenticação por email/senha.

Os dois celulares enxergam os mesmos dados — você lança um gasto, e na hora aparece no celular do(a) seu(sua) par.

---

## ⚡ TL;DR — rodar local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Firebase (uma vez só — passo a passo na próxima seção)
#    Cole sua firebaseConfig em src/environments/environment.ts

# 3. Rodar
npm start
```

App abre em http://localhost:4200.

---

## 🔥 Configurar Firebase (5 minutos, plano gratuito)

### 1. Criar projeto no Firebase

1. Vá em https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: qualquer um (ex: `mm-dates`)
4. **Desative o Google Analytics** (não precisa, deixa simples)
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
3. Modo: **"Modo de produção"** (mais seguro)
4. Localização: escolha uma próxima, ex: `southamerica-east1` (São Paulo)
5. Clique em **"Ativar"** e aguarde

### 4. Aplicar regras de segurança

1. Ainda em Firestore, clique na aba **"Regras"**
2. **Apague tudo** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Perfis de usuários
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update, delete: if request.auth.uid == userId;
    }

    // Casais
    match /couples/{coupleId} {
      // Qualquer usuário autenticado pode criar um casal novo
      // ou ler/entrar em um existente
      allow create: if request.auth != null;
      allow read, update: if request.auth != null;

      // Só membros do casal acessam dados internos
      match /{document=**} {
        allow read, write: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/couples/$(coupleId)).data.memberUids;
      }
    }
  }
}
```

3. Clique em **"Publicar"**

> **Por que essas regras?** Elas garantem que:
> - Cada usuário só altera o próprio perfil
> - Qualquer pessoa autenticada pode criar um casal novo (necessário pro signup)
> - Mas só os **membros de um casal** veem/editam os gastos e configurações daquele casal
> - Ninguém consegue ler ou bagunçar os dados de outro casal

### 5. Pegar as credenciais do projeto

1. Em **Configurações do projeto** (engrenagem ⚙️ no topo da sidebar) → aba **"Geral"**
2. Role até **"Seus apps"** → clique no ícone Web `</>`
3. Apelido do app: qualquer um (ex: `mm-dates-web`)
4. **Desmarque** "Configurar o Firebase Hosting" (vamos usar Vercel)
5. Clique em **"Registrar app"**
6. **Copie o objeto `firebaseConfig`** que aparece (algo como):

```js
const firebaseConfig = {
  apiKey: "AIzaSyA...",
  authDomain: "mm-dates.firebaseapp.com",
  projectId: "mm-dates",
  storageBucket: "mm-dates.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

### 6. Colar no projeto

Abra **`src/environments/environment.ts`** e **`src/environments/environment.production.ts`** e substitua os placeholders pelos valores que você copiou.

> **Sobre segurança:** essas credenciais ficam no bundle JavaScript do navegador — qualquer um vê elas no DevTools. **Tudo bem!** Elas não são segredos. A segurança real vem das regras do Firestore (passo 4), que impedem qualquer um de mexer nos seus dados sem estar autenticado e fazer parte do casal certo.

### 7. Pronto!

```bash
npm install
npm start
```

Crie sua conta na tela de login (deixe o "Código do casal" **vazio** na primeira vez — você vai criar um casal novo). Depois vá em **Configurações → Compartilhar com seu par** e copie o código. Sua/seu par usa esse código no signup pra entrar no mesmo casal.

---

## ☁️ Deploy no Vercel (1 minuto)

### Opção A — via GitHub (recomendado)

1. Suba o projeto pra um repo no GitHub
2. Em https://vercel.com/new, conecte o GitHub e importe o repositório
3. O Vercel detecta o `vercel.json` e configura automaticamente
4. Clique em **"Deploy"**

### Opção B — via CLI

```bash
npm install -g vercel
vercel
```

Depois do primeiro deploy, vá no painel do Firebase em **Authentication → Settings → Authorized domains** e adicione o domínio do Vercel (algo como `seu-projeto.vercel.app`). Senão, o login dá erro de domínio não autorizado.

---

## ✨ Features

- **🔐 Autenticação** — email/senha, com sistema de "casal" (dois ou mais usuários compartilhando os mesmos dados)
- **☁️ Sincronização em tempo real** — você lança um gasto e em ~1 segundo aparece no celular do(a) seu(sua) par
- **📊 Dashboard** com gráficos reativos (progresso do mês, doughnut por forma de pagamento, barras por pessoa, linha cumulativa)
- **🧾 Tela de Gastos** com busca, filtros, ordenação, editar e excluir
- **⚙️ Configurações** para mudar budget mensal e gerenciar formas de pagamento
- **🤝 Compartilhar casal** — código copiável para sua/seu par entrar no mesmo workspace
- **🌗 Light & Dark mode** com detecção da preferência do sistema
- **📅 Filtro de mês** persistente no topo de todas as telas
- **🔄 Reset mensal automático** — budget calculado por mês
- **📋 Mensagem pronta para WhatsApp** copiada com um clique
- **📱 Mobile-first** com FAB, sidenav em drawer e menu de usuário no topbar

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

Tudo fica no **Firestore** (banco do Firebase), organizado assim:

```
/users/{uid}                                    ← perfil do usuário (email, nome, coupleId)
/couples/{coupleId}                             ← documento do casal (membros, nome)
/couples/{coupleId}/config/settings             ← budget mensal + formas de pagamento
/couples/{coupleId}/expenses/{expenseId}        ← cada gasto registrado
```

Quando você lança um gasto, ele entra na subcoleção `expenses` do seu casal. Como o app usa `onSnapshot`, qualquer mudança no banco é refletida em todos os dispositivos conectados em tempo real.

### Limites do plano gratuito (Spark) do Firebase

Pra um casal usando ~50 gastos/mês:

| Recurso | Cota grátis | Uso esperado |
|---|---|---|
| Leituras Firestore | 50 mil/dia | ~10/dia |
| Escritas Firestore | 20 mil/dia | ~5/dia |
| Storage | 1 GB | < 1 MB |
| Bandwidth | 10 GB/mês | < 100 MB |

Você nunca vai chegar nem perto do limite. **Não precisa colocar cartão.**

---

## 🛠️ Scripts

| Comando         | O que faz                                  |
|-----------------|--------------------------------------------|
| `npm start`     | Roda em desenvolvimento (http://localhost:4200) |
| `npm run build` | Build de produção em `dist/snack-budget/browser` |
| `npm run watch` | Build em modo watch                        |

---

## 🗂️ Estrutura

```
mm-dates/
├── .vscode/                              # Configs do VS Code (tasks, launch, extensões)
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
│   │   │       ├── expense.service.ts    # Gastos (inscrição reativa)
│   │   │       ├── settings.service.ts   # Configurações (inscrição reativa)
│   │   │       ├── month-filter.service.ts
│   │   │       ├── theme.service.ts      # Light/dark mode
│   │   │       └── toast.service.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── login.component.ts    # Tela de login
│   │   │   ├── dashboard/                # Gráficos, resumo
│   │   │   ├── expenses/                 # Lista filtrável com CRUD
│   │   │   └── settings/                 # Budget, formas, compartilhar casal
│   │   ├── layout/
│   │   │   └── shell.component.ts        # Sidenav + topbar
│   │   ├── shared/
│   │   │   ├── components/               # Dialogs, filtro de mês
│   │   │   └── pipes/                    # BrlPipe
│   │   ├── app.component.ts
│   │   ├── app.config.ts                 # Providers Firebase
│   │   └── app.routes.ts                 # Rotas protegidas
│   ├── environments/
│   │   ├── environment.ts                # ← cole aqui sua firebaseConfig
│   │   └── environment.production.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## 🎨 Stack

- **Angular 18 standalone** + nova sintaxe de control flow (`@if`, `@for`)
- **Angular Material 18** com M3 theming (violet + rose, light/dark)
- **Firebase 10** (Authentication + Firestore) via **@angular/fire 18**
- **Signals + computed** para reatividade fina
- **ChangeDetectionStrategy.OnPush** em tudo
- **Lazy-loaded routes**
- **ng2-charts + chart.js 4** para gráficos
- **Real-time sync** via `onSnapshot`

---

## ❓ FAQ

### "O Firebase é gratuito mesmo?"
Sim, o plano Spark é gratuito sem cartão. O limite é generoso o suficiente pra dezenas de casais usarem o mesmo projeto sem encostar no teto.

### "Os dados são privados? Pode ter alguém vendo?"
Sim, são privados. As regras de segurança do Firestore só permitem leitura/escrita dos dados de um casal por membros daquele casal. Mesmo que alguém tenha o `firebaseConfig`, não consegue ver/alterar os dados sem estar autenticado e fazer parte do casal.

### "E se eu trocar de celular?"
Faça login com o mesmo email. Os dados vêm da nuvem, então tudo aparece igualzinho.

### "Posso ter mais de duas pessoas no mesmo casal?"
Pode. O campo `memberUids` é um array — qualquer um com o código do casal pode entrar. Mas o cálculo de "budget por pessoa" divide o total pelos owners únicos das formas de pagamento, não pelo número de usuários.

### "E se eu esquecer a senha?"
Pelo console do Firebase em **Authentication → Users**, você pode resetar a senha de qualquer usuário manualmente. (Recurso de "esqueci minha senha" no app não foi implementado pra manter simples — dá pra adicionar depois usando `sendPasswordResetEmail` do Firebase.)

---

Feito com 💕 para Math & Mari.
