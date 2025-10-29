# Integração WhatsApp Business API

## Configuração

### 1. Criar App no Meta for Developers

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie um novo app
3. Adicione o produto "WhatsApp"
4. Configure um número de telefone

### 2. Configurar Webhook

1. No painel do WhatsApp, vá em "Configuration"
2. Configure o Webhook URL: `https://seu-app.vercel.app/api/whatsapp/webhook`
3. Token de verificação: use o mesmo valor de `WHATSAPP_VERIFY_TOKEN`
4. Inscreva-se nos eventos: `messages`

### 3. Variáveis de Ambiente

Adicione no Vercel ou `.env.local`:

\`\`\`env
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_VERIFY_TOKEN=seu_token_verificacao
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
\`\`\`

### 4. Testar Integração

1. Envie uma mensagem para o número configurado: "ordem"
2. Siga as instruções do bot
3. A ordem será criada automaticamente

## Fluxo de Conversação

1. **Início**: Cliente envia "ordem" ou "serviço"
2. **Coleta de dados**:
   - Informações do cliente (nome, endereço, responsável)
   - Tipo de serviço (manutenção, orçamento, vistoria, preventiva)
   - Descrição do problema
3. **Confirmação**: Resumo e confirmação
4. **Criação**: Ordem criada automaticamente
5. **Notificação**: Cliente recebe número da OS e link

## Notificações Automáticas

- Quando a OS é concluída, o cliente recebe notificação automática via WhatsApp
- Use a rota: `POST /api/ordens-servico/[id]/concluir`

## Melhorias Futuras

- [ ] Adicionar botões interativos
- [ ] Enviar fotos do serviço realizado
- [ ] Permitir agendamento via WhatsApp
- [ ] Integrar com calendário do técnico
- [ ] Adicionar avaliação de serviço
