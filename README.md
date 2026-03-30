# SquashRank Pro

Sistema completo de gerenciamento de rankings para a Federação de Squash do Paraná.

## 🚀 Funcionalidades

### Área Pública
- **Rankings**: Visualização de rankings por classe (1a, 2a, 3a, 4a, 5a, 6a, Duplas) e categoria (Masculino/Feminino)
- **Torneios**: Lista de todos os torneios disputados
- **Jogadores**: Cadastro completo de atletas com fotos
- **Geração de Imagens**: Criar imagens Top 10 para compartilhamento

### Área Administrativa (Requer Login)
- **Dashboard**: Visão geral com estatísticas
- **Gestão de Torneios**: CRUD completo
- **Gestão de Jogadores**: CRUD com upload de fotos
- **Gestão de Resultados**: Registro de resultados com cálculo automático de pontos
- **Importação de Resultados**: Upload de imagem de chave de torneio para extração automática via IA
- **Configuração de Ranking**: Personalização da fórmula de cálculo e tabela de pontos

## 🛠️ Tecnologias

- **Frontend**: React 19, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.11
- **Banco de Dados**: MongoDB
- **IA**: Emergent Integrations (Gemini 3 Flash para análise de imagens)

## 📝 Classes Disponíveis

- 1a Classe
- 2a Classe
- 3a Classe
- 4a Classe
- 5a Classe
- 6a Classe
- Duplas

## 🎯 Fórmulas de Ranking

1. **Soma de todos os resultados**: Soma todos os pontos obtidos
2. **Média dos N melhores**: Considera apenas os N melhores resultados
3. **Decaimento por antiguidade**: Aplica fator de decaimento em resultados mais antigos

## 🔐 Acesso Administrativo

1. Acesse `/login`
2. Crie uma conta ou faça login
3. Acesse o painel administrativo

### Primeira Vez

1. Registre uma conta admin
2. Configure a tabela de pontos em **Admin > Config. Ranking**
3. Cadastre torneios em **Admin > Torneios**
4. Cadastre jogadores em **Admin > Jogadores**
5. Registre resultados em **Admin > Resultados**

## 📸 Importação via Imagem

O sistema pode extrair automaticamente resultados de imagens de chaves de torneio:

1. Vá em **Admin > Resultados**
2. Clique em **Importar de Imagem**
3. Faça upload de uma captura de tela da chave
4. A IA extrai automaticamente os jogadores e colocações
5. Revise e salve os resultados

## 🎨 Logo

Para adicionar o logo da federação:
1. Edite `/app/frontend/src/components/Layout.js`
2. Substitua o placeholder no cabeçalho pela URL do logo

## 🚀 Deploy

O sistema está configurado para rodar em:
- Frontend: Porta 3000
- Backend: Porta 8001
- MongoDB: Porta 27017

Serviços gerenciados via supervisor:
```bash
sudo supervisorctl status
sudo supervisorctl restart all
```

## 📊 Estrutura do Banco de Dados

- `users`: Usuários administrativos
- `players`: Jogadores cadastrados
- `tournaments`: Torneios disputados
- `results`: Resultados de cada jogador em cada torneio
- `ranking_config`: Configuração da fórmula e tabela de pontos




