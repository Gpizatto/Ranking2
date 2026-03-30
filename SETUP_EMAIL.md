# 📧 Como Configurar o Email para Sistema de Registro

## ✅ Status Atual
- Sistema de código de registro **IMPLEMENTADO**
- Falta apenas: **Adicionar API Key do Resend**

## 🚀 Passo a Passo (5 minutos)

### 1. Criar Conta no Resend (Grátis)
1. Acesse: https://resend.com
2. Clique em **"Sign Up"** (canto superior direito)
3. Registre-se com seu email (pode usar gustavopizatto@hotmail.com)
4. Confirme seu email

### 2. Obter API Key
1. Após login, vá para: https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. Nome sugerido: `SquashRank Pro`
4. Permissões: **"Full Access"** ou **"Send Only"**
5. Clique em **"Create"**
6. **COPIE a chave** (começa com `re_...`)
   - ⚠️ Você só verá ela UMA VEZ!

### 3. Adicionar a Key no Sistema
1. Edite o arquivo: `/app/backend/.env`
2. Substitua a linha:
   ```
   RESEND_API_KEY=
   ```
   Por:
   ```
   RESEND_API_KEY=re_sua_chave_aqui
   ```

### 4. Reiniciar o Backend
Execute no terminal:
```bash
sudo supervisorctl restart backend
```

## 🎯 Como Funciona Agora

### Para NOVOS Usuários:
1. Tentam se registrar em `/login` → aba "Registrar"
2. Inserem usuário e senha → Clicam "Solicitar Registro"
3. **Você recebe um EMAIL** em gustavopizatto@hotmail.com com:
   - Nome do usuário tentando registrar
   - Código de 6 caracteres (ex: **ABC123**)
   - Data e hora da tentativa

4. Se você aprovar:
   - Envie o código para a pessoa
   - Ela insere o código na tela
   - Registro é completado automaticamente

5. **Código expira em 24 horas**

### Para Usuários EXISTENTES:
- Login funciona normalmente sem código

## 📧 Detalhes do Email
- **Remetente**: onboarding@resend.dev
- **Destinatário**: gustavopizatto@hotmail.com
- **Assunto**: 🎾 Nova Solicitação de Registro - [nome_usuario]
- **Conteúdo**: Email formatado com código destacado

## 🔒 Segurança
- ✅ Senhas criptografadas com bcrypt
- ✅ Código único por solicitação
- ✅ Expiração em 24 horas
- ✅ Apenas admin recebe o email
- ✅ Código de 6 caracteres (alfanumérico)

## 📝 Modo Teste do Resend
No plano grátis do Resend:
- ✅ Emails funcionam normalmente
- ✅ Você pode enviar para qualquer email
- ⚠️ Limite: 100 emails/dia (mais que suficiente)

## ❓ Problemas?
Se não receber o email:
1. Verifique spam/lixo eletrônico
2. Confirme que a API key está correta no .env
3. Verifique os logs: `tail -n 50 /var/log/supervisor/backend.err.log`

## 🧪 Testando
1. Vá em: https://squash-scores.preview.emergentagent.com/login
2. Clique em "Registrar"
3. Preencha usuário e senha
4. Clique em "Solicitar Registro"
5. Aguarde o email chegar
6. Insira o código recebido

---

**Pronto!** Após adicionar a API key, o sistema estará 100% funcional.
