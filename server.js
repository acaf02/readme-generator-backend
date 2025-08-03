import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get("/", (req, res) => {
  res.send("API Readme Generator rodando!");
});


app.post("/generate-readme", async (req, res) => {
  const { projectData } = req.body;

  if (!projectData) {
    return res.status(400).json({ error: "Dados do projeto ausentes." });
  }

  let statusSection = `Este projeto está ${
    projectData.status || "não informado"
  }.\n\n`;

  if (projectData.status && projectData.status.toLowerCase() !== "concluído") {
    const tasks = projectData.nextSteps?.length
      ? projectData.nextSteps.map((t) => `- [ ] ${t}`).join("\n")
      : "- [ ] Tarefas ainda não definidas";
    statusSection += `O projeto ainda está em desenvolvimento e as próximas atualizações serão voltadas para as seguintes tarefas:\n\n${tasks}\n`;
  }

  const techLines = [];
  if (projectData.technologies?.frontend)
    techLines.push(`- **Frontend**: ${projectData.technologies.frontend}`);
  if (projectData.technologies?.backend)
    techLines.push(`- **Backend**: ${projectData.technologies.backend}`);
  if (projectData.technologies?.database)
    techLines.push(`- **Banco de Dados**: ${projectData.technologies.database}`);
  if (projectData.technologies?.auth)
    techLines.push(`- **Autenticação**: ${projectData.technologies.auth}`);
  if (projectData.technologies?.tests)
    techLines.push(`- **Testes**: ${projectData.technologies.tests}`);
  if (projectData.technologies?.others)
    techLines.push(`- **Outros**: ${projectData.technologies.others}`);

  const techSection = techLines.length > 0
    ? `Este projeto utiliza as seguintes tecnologias:\n\n${techLines.join("\n")}`
    : `*Nenhuma tecnologia informada.*`;

  const prerequisitesSection = projectData.prerequisites?.trim()
    ? projectData.prerequisites
    : `- [Node.js](https://nodejs.org) (versão 12 ou superior)
- [Yarn](https://yarnpkg.com) (opcional, mas recomendado)
- [Docker](https://www.docker.com/get-started) (para ambientes de desenvolvimento isolados)`;

  const prompt = `
Você é um gerador de README. ⚠️ **NÃO MUDE a estrutura abaixo, NÃO invente novos títulos e NÃO adicione seções extras.**  
Para a seção **Sobre o Projeto** e **Status do Projeto**, escreva de forma **rica, detalhada e explicativa**, com frases bem elaboradas.
- Para **Tecnologias Utilizadas**, **Instalação** e **Uso**, apenas insira os valores informados, sem adicionar descrições extras.
- Se o **status for "concluído"**, NÃO exiba o texto de desenvolvimento nem a lista de tarefas.
- Se alguma tecnologia não for preenchida, NÃO exiba a linha correspondente.
---

# ${projectData.title || "Não informado"}

## 🛠️ Sobre o Projeto

![Exemplo de Imagem](imagem.png)

> Este projeto é uma aplicação moderna ${
    projectData.description || "não informado"
  }.

---

## 🟢 Status do Projeto

${statusSection}

---

## 🧰 Tecnologias Utilizadas

${techSection}

---

## ⚙️ Instalação

### 🖥️ Pré-requisitos

Certifique-se de que você tem os seguintes itens instalados no seu ambiente:

${prerequisitesSection}

### 🔧 Instalação no macOS/Linux

\`\`\`bash
git clone ${projectData.repoLink || "[link do projeto do github]"}
cd ${projectData.title || "projeto"}
${projectData.installLinux || "npm install"}
\`\`\`

### 💻 Instalação no Windows

\`\`\`bash
git clone ${projectData.repoLink || "[link do projeto do github]"}
cd ${projectData.title || "projeto"}
${projectData.installWindows || "npm install"}
\`\`\`

---

## 🚀 Uso

Depois de instalar o projeto, você pode rodá-lo com o seguinte comando:

\`\`\`bash
yarn start   # ou npm start
\`\`\`

Isso iniciará o servidor e abrirá o aplicativo em seu navegador na URL: http://localhost:3000.

---

## 🤝 Contribuições

Contribuições são sempre bem-vindas! Para contribuir, siga os seguintes passos:

Faça o fork deste repositório.<br>
Crie uma branch para a sua feature \`git checkout -b nome-da-feature\`.<br>
Realize as alterações necessárias.<br>
Faça um commit com uma mensagem clara e concisa \`git commit -m 'Adiciona nova feature'\`.<br>
Envie para o seu fork \`git push origin nome-da-feature\`.<br>
Abra uma pull request para o repositório original.<br>

🔄 Antes de contribuir, verifique se o código está funcionando corretamente. Execute os testes ou faça a revisão do código para garantir a qualidade!

---

## 📜 Licença

Este projeto está sob a Licença ${
    projectData.license || "MIT"
  }. Veja o arquivo [LICENÇA](LICENSE) para mais detalhes.

---

### ⭐ Gostou do projeto? Deixe uma estrela para ajudar a comunidade!
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const readmeContent = response.text();
    res.status(200).json({ readme: readmeContent });
  } catch (error) {
    console.error("Erro ao gerar README:", error);
    res.status(500).json({ error: "Erro ao gerar README com Gemini." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
