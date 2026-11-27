# Evolift

Organize sua rotina de treinos de segunda a sexta, acompanhe o planejamento semanal e consulte seus exercícios durante o treino. O Evolift é um aplicativo web responsivo e instalável (PWA), com tema escuro por padrão e dados armazenados localmente no navegador.

## Recursos

### Planejamento semanal

- Organize treinos de segunda a sexta em semanas independentes.
- Consulte a faixa de datas, navegue entre semanas e crie uma semana em branco ou uma cópia da semana selecionada.
- Exclua uma semana específica; as semanas restantes são renumeradas. Se a última semana for excluída, uma Semana 1 vazia é criada.
- Use “Recomeçar na Semana 1” para apagar a organização de treinos e iniciar uma semana vazia para a semana atual.
- Acompanhe o progresso de segunda a sexta: a barra considera como planejado cada dia com treino ou descanso registrado. O resumo diferencia dias com treino de dias de descanso.

### Treinos e atividades

- Dê um nome ao treino de cada dia.
- Cadastre, edite, exclua e reorganize exercícios.
- Informe séries, carga e repetições individualmente para cada série, além de observações opcionais.
- Registre atividades de cardio com duração e, opcionalmente, distância, intensidade e observações.
- Marque um dia como descanso com justificativa obrigatória. O treino existente permanece salvo e pode ser retomado depois.

### Perfil, preferências e dados

- Salve nome, e-mail e foto de perfil opcionais neste dispositivo.
- Escolha o tema escuro ou claro, configure a meta semanal de 1 a 7 dias e selecione kg ou lb.
- Ao trocar a unidade de peso, as cargas numéricas salvas são convertidas.
- Exporte um arquivo JSON com os dados do Evolift, incluindo semanas, treinos, perfil e preferências.
- Restaure as preferências padrão sem apagar os treinos ou limpe os dados armazenados após confirmação.

As alterações são salvas automaticamente no navegador. Não há conta, servidor de dados ou sincronização entre dispositivos. A meta configurável é uma preferência; a barra de progresso da tela principal mostra os dias planejados entre os cinco dias úteis.

## Instalar e usar no celular (PWA)

O Evolift pode ser instalado pela opção oferecida pelo navegador quando acessado por um endereço **HTTPS** compatível. Na primeira visita, abra o aplicativo com conexão à internet para que os arquivos da interface sejam armazenados para uso offline.

- **Android:** abra o endereço HTTPS no Chrome e escolha **Instalar app** ou **Adicionar à tela inicial** no menu do navegador.
- **iPhone/iPad:** abra o endereço HTTPS no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.

Os nomes das opções podem variar conforme o navegador e a versão do sistema. Depois de instalado, o Evolift abre em uma janela própria. O service worker mantém em cache os arquivos principais da interface e pode servi-los quando a rede estiver indisponível. Os treinos continuam salvos no armazenamento local do navegador daquele dispositivo.

### Acessar pela rede local para testar

1. Conecte o computador e o celular à mesma rede Wi-Fi.
2. No computador, abra o terminal na pasta do projeto e execute:

   ```powershell
   node .\serve.js
   ```

3. No celular, abra no navegador o endereço de rede informado pelo servidor, por exemplo `http://192.168.1.10:4173`.

Esse acesso por IP local em HTTP serve para testar a interface no celular, mas navegadores normalmente não consideram esse endereço um contexto seguro. Por isso, o registro do service worker e a instalação PWA podem não estar disponíveis. Para instalar o app no celular e usar o cache offline, publique o site em uma hospedagem com HTTPS. `localhost` é considerado seguro para testes no próprio computador.

Mantenha o servidor ligado enquanto estiver testando pela rede local. Se o Windows solicitar acesso à rede para o Node.js, permita-o em redes privadas.

## Executar localmente

É necessário ter o Node.js instalado. Na pasta do projeto, inicie o servidor:

```powershell
node .\serve.js
```

Abra `http://localhost:4173` no navegador. O servidor também exibe o endereço de rede local, útil para testar em outro dispositivo conectado ao mesmo Wi-Fi.

## Dados e privacidade

Sem sincronização: cada navegador e dispositivo mantém seus próprios dados. Limpar os dados do site no navegador remove os registros locais. Para guardar uma cópia, use **Perfil e configurações → Exportar dados**. O arquivo exportado também pode conter dados de perfil, inclusive a foto; armazene-o com cuidado.

As notificações e os lembretes em segundo plano não estão disponíveis nesta versão.

## Tecnologias

- HTML, CSS e JavaScript sem frameworks.
- Web App Manifest para metadados e instalação do PWA.
- Service worker para cache da interface e suporte offline após o carregamento inicial.
- `localStorage` para semanas, treinos, perfil e preferências.
- Servidor de desenvolvimento Node.js simples, sem dependências externas.

## Estrutura do projeto

```text
Evolift/
├── assets/
│   └── logo-evolift-transparente.png
├── icons/
│   ├── evolift.ico
│   ├── icon-192.png
│   └── icon-512.png
├── js/
│   └── script.js
├── styles/
│   └── style.css
├── index.html
├── manifest.json
├── service-worker.js
├── serve.js
└── README.md
```