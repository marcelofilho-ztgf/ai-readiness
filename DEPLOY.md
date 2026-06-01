# Deploy no Render (via GitHub)

Resultado: um link público tipo `https://ai-readiness.onrender.com` pra compartilhar.

> Pré-requisitos: conta no [GitHub](https://github.com) e no [Render](https://render.com) (login com o GitHub funciona). Git instalado na sua máquina.

---

## Passo 1 — Subir o código pro GitHub

No terminal, dentro da pasta do projeto:

```bash
cd "/Users/mfilhog/Cowork/project-head/project-head/ai-readiness"
git init
git add .
git commit -m "AI-Readiness Check"
```

Crie um repositório vazio no GitHub:
1. Vá em https://github.com/new
2. Nome: `ai-readiness` (ou o que quiser)
3. Deixe **sem** README, .gitignore ou license (o projeto já tem)
4. Clique em **Create repository**

O GitHub mostra a URL do repo. Conecte e suba:

```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/ai-readiness.git
git push -u origin main
```

(troque `SEU_USUARIO` pelo seu usuário do GitHub)

---

## Passo 2 — Conectar no Render

1. Entre em https://dashboard.render.com
2. **New** → **Web Service**
3. Conecte sua conta GitHub e selecione o repositório `ai-readiness`
4. O Render vai detectar o `render.yaml` automaticamente e preencher tudo. Se pedir manualmente, use:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm install --prefix client && npm run build --prefix client`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Clique em **Create Web Service**

O primeiro build leva ~2-3 min. Quando terminar, o Render te dá o link público.

---

## Passo 3 — Pronto

Seu link fica algo como `https://ai-readiness.onrender.com`. Compartilhe à vontade.

### Atualizações futuras

Toda vez que você der `git push` na branch `main`, o Render rebuilda e redeploya sozinho. Pra mudar algo:

```bash
git add .
git commit -m "ajuste no visual"
git push
```

---

## Notas

- **Cold start:** no plano free, o serviço "dorme" após ~15 min sem acesso. A primeira visita depois disso demora ~30s pra acordar. Pra eliminar isso, o plano pago mais barato do Render resolve, ou um "ping" periódico (posso configurar depois se quiser).
- **Custo:** zero no plano free pra esse volume de uso.
- **Domínio próprio:** dá pra apontar um domínio seu (ex: `geo.seudominio.com`) nas settings do Render → Custom Domains.
