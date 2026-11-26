# Evolift

Organize sua rotina de musculação de segunda a sexta e consulte seus exercícios durante o treino.

## Funcionalidades

- Organize os treinos de segunda a sexta em semanas independentes.
- Crie uma semana em branco ou copie a semana selecionada para começar a próxima rotina.
- Exclua a semana selecionada após confirmar; ao excluir a última, uma semana vazia é criada para manter o organizador pronto para uso.
- Defina um nome para cada treino e cadastre exercícios com a quantidade de séries, uma carga e repetições opcionais para cada série, além de observações.
- Adicione atividades de cardio ao treino com duração e, se quiser, distância, intensidade e observações.
- Marque um dia como descanso com justificativa obrigatória e retome o treino sem perder o planejamento salvo.
- Edite, exclua e reorganize os exercícios de cada dia.
- Navegue pelas semanas anteriores e mantenha seus registros salvos automaticamente no navegador.
- Use a interface responsiva em computadores e celulares, com tema escuro por padrão.

## Como usar

Abra `index.html` no navegador ou inicie um servidor local, por exemplo com a extensão Live Server do Visual Studio Code. Escolha um dia da semana para cadastrar o treino e use os controles no topo para criar, copiar ou excluir semanas.

Os dados são salvos no `localStorage` do navegador e ficam disponíveis no mesmo navegador e perfil de usuário. Não há servidor ou sincronização entre dispositivos. Limpar os dados do site no navegador também remove as semanas salvas.

## Tecnologias

- HTML5
- CSS3
- JavaScript

## Estrutura

```text
Evolift/
├── index.html
├── js/
│   └── script.js
├── styles/
│   └── style.css
└── README.md
```
