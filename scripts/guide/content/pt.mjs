/**
 * Guia do utilizador PDRS-CEEAC — conteúdo em português (traduzido a partir de fr.mjs).
 * Sintaxe: **texto** = negrito. As etiquetas entre « » reproduzem exatamente
 * as da interface (src/i18n/pt.ts).
 */
export default {
  lang: "pt",
  file: "Guide-Utilisateur-PDRS-CEEAC-PT.docx",
  meta: {
    locale: "pt-PT",
    title: "Guia do utilizador — PDRS-CEEAC",
    subject:
      "Guia do utilizador do Portal Documental das Reuniões Estatutárias da CEEAC destinado aos delegados e peritos dos Estados-Membros",
    header: "Guia do utilizador · Espaço do participante",
    footer: "© 2026 CEEAC-ECCAS · Portal Documental das Reuniões Estatutárias",
  },
  labels: {
    figure: "Figura",
    table: "Quadro",
    toc: "Índice",
    tocHint:
      "Se o índice não for apresentado, aceite a atualização dos campos proposta pelo Word ao abrir o documento (ou clique com o botão direito › Atualizar campo).",
    page: "Página",
  },
  cover: {
    community: "Comunidade Económica dos Estados da África Central",
    secretariat: "Comissão da CEEAC · Secretariado das reuniões estatutárias",
    platform: "Portal Documental das Reuniões Estatutárias da CEEAC",
    title: "Guia do utilizador",
    subtitle: "Espaço do participante e acesso de convidado",
    version: "Versão 3.0 — Outubro de 2026",
    audience: "Destinado aos delegados e peritos acreditados dos Estados-Membros",
  },
  sheet: {
    title: "Ficha do documento",
    rows: [
      ["Título", "Guia do utilizador da plataforma PDRS-CEEAC — Espaço do participante"],
      ["Versão", "3.0 — outubro de 2026"],
      ["Destinatários", "Delegados, peritos e pontos focais dos Estados-Membros; convidados que disponham dos códigos de uma reunião"],
      ["Línguas", "Français · English · Português · Español"],
      ["Novidades da versão 3.0", "Leitor de documentos integrado (PDF e Word); acesso compartimentado por reunião; adição de uma reunião através dos respetivos códigos; capturas de ecrã atualizadas"],
      ["Contacto", "Secretariado da CEEAC — endereço indicado na página de início de sessão da plataforma"],
    ],
  },
  chapters: [
    {
      title: "1. Apresentação da plataforma",
      blocks: [
        { p: "O **PDRS-CEEAC** (Portal Documental das Reuniões Estatutárias da CEEAC) é a plataforma oficial de disponibilização dos documentos das reuniões estatutárias da Comunidade: Conferência dos Chefes de Estado e de Governo, Conselho de Ministros, Comité de Embaixadores, Comités Técnicos Especializados e outras reuniões estatutárias." },
        { p: "Implementada pela Comissão da CEEAC, a plataforma oferece aos delegados e peritos dos Estados-Membros:" },
        {
          bullets: [
            "a **leitura em linha** dos documentos oficiais diretamente na plataforma, graças ao leitor integrado, sem necessidade de descarregamento nem de software adicional;",
            "o **descarregamento** de cada documento nas línguas da Comunidade disponíveis — francês, inglês, português e espanhol;",
            "o acompanhamento do **calendário das reuniões estatutárias** e os **fios de discussão** próprios de cada reunião;",
            "a receção, por correio eletrónico, dos relatórios e documentos difundidos pelo Secretariado.",
          ],
        },
        { p: "Os documentos estão acessíveis **antes, durante e após** cada reunião. Cada acesso é **compartimentado**: os códigos de uma reunião apenas dão acesso aos documentos dessa reunião." },
        { box: { kind: "info", title: "A ter em conta", text: "A plataforma funciona em qualquer navegador recente (Chrome, Edge, Firefox, Safari), a partir de um computador, de um tablet ou de um telemóvel. Não é necessária qualquer instalação. O endereço da plataforma é-lhe comunicado pelo Secretariado da CEEAC ou pelo seu ponto focal nacional." } },
      ],
    },
    {
      title: "2. Modos de acesso",
      blocks: [
        { p: "Antes de cada reunião estatutária, o Secretariado transmite aos Estados-Membros dois códigos de acesso: um **identificador de reunião** (no formato CEEAC-XXXXXX) e uma **palavra-passe de acesso** (no formato XXXX-XXXX). Estes códigos dão acesso a dois níveis:" },
        {
          bullets: [
            ["Acesso de convidado", "introduz os códigos da reunião na página de início de sessão e consulta de imediato os documentos da reunião, sem criar conta (capítulo 3);"],
            ["Conta de participante", "pode, se o desejar, criar a sua conta pessoal com os mesmos códigos. Esta conta é necessária para participar nas discussões, receber as difusões por e-mail e reunir várias reuniões num mesmo espaço (capítulo 4);"],
            ["Conta criada pelo Secretariado", "em determinados casos, o Secretariado cria diretamente a sua conta e entrega-lhe uma palavra-passe provisória, a personalizar no primeiro início de sessão (secção 5.1)."],
          ],
        },
        {
          table: {
            caption: "Funcionalidades disponíveis consoante o modo de acesso",
            head: ["Funcionalidade", "Convidado (códigos de reunião)", "Participante (conta)"],
            widths: [50, 25, 25],
            center: [1, 2],
            rows: [
              ["Ler os documentos no leitor integrado", "Sim", "Sim"],
              ["Descarregar os documentos (todas as línguas disponíveis)", "Sim", "Sim"],
              ["Pesquisar e filtrar a biblioteca", "Sim", "Sim"],
              ["Reuniões acessíveis", "A reunião dos códigos introduzidos", "Todas as reuniões abertas à conta"],
              ["Consultar o calendário das reuniões estatutárias", "—", "Sim"],
              ["Participar nos fios de discussão", "—", "Sim"],
              ["Receber os relatórios difundidos por e-mail", "—", "Sim"],
              ["Duração do acesso", "24 horas, renovável", "Permanente"],
            ],
          },
        },
      ],
    },
    {
      title: "3. Aceder aos documentos com os códigos de reunião (convidado)",
      blocks: [
        { p: "Esta é a via mais direta: não exige a criação de qualquer conta e é perfeitamente adequada à consulta dos documentos de uma reunião." },
        {
          steps: [
            ["Abra o endereço da plataforma no seu navegador."],
            ["Na página de início de sessão, selecione o separador **« Códigos de reunião »**."],
            ["Introduza o **identificador de reunião** (CEEAC-XXXXXX) e a **palavra-passe de acesso** recebidos.", "As maiúsculas são aplicadas automaticamente."],
            ["Clique em **« Aceder aos documentos »**.", "A biblioteca da reunião abre-se de imediato."],
          ],
        },
        { figure: ["01b-connexion-codes.png", "O separador « Códigos de reunião » da página de início de sessão"] },
        { p: "Na qualidade de convidado, pode ler e descarregar livremente todos os documentos publicados para a reunião. Uma faixa informativa recorda-lhe o seu estatuto e propõe-lhe, a qualquer momento, a criação da sua conta de participante." },
        { figure: ["03b-espace-invite.png", "O espaço documental com acesso de convidado e a faixa informativa"] },
        { box: { kind: "warning", title: "Duração e renovação do acesso de convidado", text: "O acesso de convidado é válido durante 24 horas; para o renovar, basta introduzir novamente os códigos da reunião. Se o Secretariado renovar os acessos de uma reunião, os códigos anteriores deixam imediatamente de funcionar. Comunique os códigos apenas aos membros autorizados da sua delegação." } },
      ],
    },
    {
      title: "4. Criar a sua conta de participante (facultativo)",
      blocks: [
        { p: "A criação de uma conta pessoal não é necessária para ler os documentos. Contudo, dá acesso às funcionalidades de colaboração: fios de discussão das reuniões, receção dos relatórios difundidos por e-mail e agrupamento de várias reuniões no seu espaço. Os mesmos códigos de reunião servem para a inscrição." },
        {
          steps: [
            ["Abra a página de inscrição:", "ligação « Inscreva-se aqui » da página de início de sessão ou ligação « Criar a minha conta » do espaço de convidado."],
            ["Na secção **« Acessos da reunião »**, introduza o identificador e a palavra-passe da reunião recebidos."],
            ["Na secção **« As suas informações »**, indique o seu nome completo, o seu endereço de e-mail institucional e o seu país.", "A função e a instituição são facultativas."],
            ["Escolha a sua palavra-passe pessoal (mínimo de 8 caracteres) e confirme-a."],
            ["Clique em **« Criar a minha conta »**.", "Fica imediatamente com sessão iniciada e é encaminhado(a) para a biblioteca documental."],
          ],
        },
        { figure: ["02-inscription.png", "A página de inscrição: acessos da reunião e, em seguida, informações pessoais"] },
        { box: { kind: "info", title: "Importante", text: ["Os códigos de reunião servem apenas para abrir o acesso. Uma vez criada a sua conta, inicia sempre sessão com **o seu endereço de e-mail e a sua palavra-passe pessoal**.", "As inscrições são encerradas quando uma reunião termina; os respetivos documentos continuam, no entanto, consultáveis com os códigos de reunião."] } },
      ],
    },
    {
      title: "5. Iniciar sessão com a sua conta",
      blocks: [
        {
          steps: [
            ["Abra o endereço da plataforma no seu navegador."],
            ["No separador **« Tenho uma conta »**, introduza o seu endereço de e-mail e a sua palavra-passe."],
            ["Clique em **« Iniciar sessão »**."],
          ],
        },
        { figure: ["01-connexion.png", "A página de início de sessão — separador « Tenho uma conta »"] },
        { p: "A sua sessão de trabalho permanece ativa durante 7 dias no dispositivo utilizado. Para terminar a sessão, clique no ícone de fim de sessão situado no canto superior direito do ecrã, em especial num posto partilhado." },
        { h2: "5.1. Primeiro início de sessão com uma palavra-passe provisória" },
        { p: "Se a sua conta foi criada pelo Secretariado, ser-lhe-á entregue uma palavra-passe provisória. No primeiro início de sessão, a plataforma convida-o(a) a definir a sua palavra-passe pessoal:" },
        {
          steps: [
            ["Inicie sessão com o seu endereço de e-mail e a palavra-passe provisória recebida."],
            ["Introduza a palavra-passe provisória e, em seguida, a nova palavra-passe (mínimo de 8 caracteres) e a respetiva confirmação."],
            ["Clique em **« Definir a minha palavra-passe »**.", "Acede então ao seu espaço."],
          ],
        },
        { figure: ["03-premiere-connexion.png", "O ecrã do primeiro início de sessão: definição da palavra-passe pessoal"] },
        { box: { kind: "security", title: "Segurança da sua palavra-passe", text: "Escolha uma palavra-passe robusta e pessoal (letras, algarismos e caracteres especiais). A palavra-passe é conservada de forma cifrada: nem o Secretariado nem o administrador a podem consultar. Em caso de esquecimento, solicite a sua reposição ao Secretariado da CEEAC." } },
      ],
    },
    {
      title: "6. A biblioteca documental",
      blocks: [
        { p: "A biblioteca constitui a sua página inicial. Reúne os documentos oficiais publicados para as reuniões que lhe estão abertas, agrupados por estado da reunião (**reunião em curso**, **reuniões futuras**, **reuniões concluídas** e, por fim, **outros documentos**)." },
        { figure: ["04-bibliotheque.png", "A biblioteca documental: pesquisa, filtros, leitura e descarregamento por língua"] },
        { h2: "6.1. Pesquisar e filtrar" },
        {
          bullets: [
            ["Pesquisa", "introduza uma ou mais palavras do título ou do nome do ficheiro no campo « Pesquisar um documento… »;"],
            ["Reunião", "o seletor « Todas as reuniões » restringe a apresentação aos documentos de uma determinada reunião;"],
            ["Categoria", "clique numa categoria (por exemplo Rapport, Résolution, Ordre du Jour, Note Conceptuelle — designações definidas pelo Secretariado);"],
            ["Língua", "os botões com bandeiras apresentam apenas os documentos disponíveis na língua escolhida;"],
            ["Reposição", "o botão « Repor os filtros » restabelece a apresentação completa; o número de documentos correspondentes é indicado à direita."],
          ],
        },
        { h2: "6.2. Ler ou descarregar um documento" },
        { p: "Para cada documento, são propostas duas ações por versão linguística:" },
        {
          bullets: [
            ["Ler", "clique no **título do documento** ou no botão **olho**: o documento abre-se no leitor integrado (capítulo 7);"],
            ["Descarregar", "clique no botão da língua pretendida (bandeira e código FR, EN, PT, ES): o progresso é apresentado no botão e, em seguida, o ficheiro é guardado no seu dispositivo."],
          ],
        },
        { p: "São propostas apenas as línguas efetivamente disponíveis para cada documento. A menção « Versão n » assinala que um documento foi atualizado pelo Secretariado: a biblioteca apresenta sempre a versão mais recente." },
        { h2: "6.3. Documentos codificados" },
        { p: "Alguns documentos sensíveis ostentam o distintivo vermelho **« Documento codificado »**: o ficheiro foi cifrado pelo Secretariado antes da sua publicação. A sua abertura requer a **chave de leitura** comunicada separadamente, por um canal seguro. Se não tiver recebido esta chave, contacte o seu ponto focal ou o Secretariado da CEEAC." },
      ],
    },
    {
      title: "7. Ler um documento na plataforma",
      blocks: [
        { p: "O **leitor integrado** apresenta os documentos PDF e Word diretamente na plataforma, em ecrã inteiro, sem descarregamento nem software adicional. Abre-se com um clique no título de um documento ou no botão olho; por predefinição, apresenta a versão na língua da interface, quando esta existe." },
        { figure: ["04b-lecteur.png", "O leitor integrado: cabeçalho do documento, versões linguísticas, descarregamento e barra de ferramentas"] },
        { h2: "7.1. Composição do leitor" },
        {
          bullets: [
            ["Cabeçalho", "título do documento, referência da reunião, nome e tamanho do ficheiro e, se aplicável, o distintivo « Codificado »;"],
            ["Versões linguísticas", "as bandeiras FR · EN · PT · ES permitem passar de uma língua para outra sem fechar o leitor;"],
            ["Descarregar", "o botão « Descarregar » guarda no seu dispositivo a versão apresentada;"],
            ["Barra de ferramentas", "navegação por página, zoom, rotação, pesquisa e ecrã inteiro;"],
            ["Barra de estado", "número de páginas, nível de zoom e lembrete dos atalhos de teclado."],
          ],
        },
        { h2: "7.2. Navegar e ajustar a apresentação" },
        {
          table: {
            caption: "Comandos da barra de ferramentas do leitor",
            head: ["Comando", "Efeito"],
            widths: [32, 68],
            rows: [
              ["Setas ‹ e ›", "Página anterior / página seguinte."],
              ["Campo « n de N »", "Introduza um número de página e prima Enter para aceder diretamente a essa página."],
              ["Lupas − e +", "Reduzir / ampliar a apresentação por níveis (50 % a 300 %)."],
              ["Lista de zoom", "« Ajustar à largura », « Página inteira » ou uma percentagem específica."],
              ["Seta circular", "Rodar as páginas um quarto de volta (documentos PDF)."],
              ["Lupa (à direita)", "Abrir a pesquisa no documento."],
              ["Moldura (à direita)", "Passar para ecrã inteiro / sair do ecrã inteiro."],
              ["Cruz (cabeçalho)", "Fechar o leitor e regressar à biblioteca."],
            ],
          },
        },
        { p: "Pode também percorrer o documento com o rato, o painel tátil ou o dedo: o número da página atual é atualizado automaticamente. O texto dos documentos PDF pode ser selecionado e copiado." },
        { h2: "7.3. Pesquisar no documento" },
        {
          steps: [
            ["Clique na lupa da barra de ferramentas ou prima **Ctrl + F**."],
            ["Introduza uma palavra ou expressão e prima **Enter**.", "A pesquisa ignora maiúsculas e acentos."],
            ["O leitor apresenta a primeira página correspondente e realça as passagens encontradas. Prima novamente Enter, ou utilize as setas ˄ ˅, para passar de um resultado para outro."],
          ],
        },
        { figure: ["04c-lecteur-recherche.png", "Pesquisa em texto integral: resultado atual, número de resultados e passagens realçadas"] },
        { h2: "7.4. Documentos Word" },
        { p: "Os documentos Word recentes (formato .docx) são apresentados com a respetiva formatação: títulos, parágrafos, tabelas e imagens. A pesquisa, o zoom e o descarregamento funcionam tal como para um PDF." },
        { figure: ["04d-lecteur-word.png", "Um documento Word apresentado no leitor integrado"] },
        { h2: "7.5. Documentos protegidos por uma chave de leitura" },
        { p: "Quando um documento codificado é um PDF protegido por palavra-passe, o leitor apresenta o ecrã **« Documento protegido por uma chave de leitura »**. Introduza a chave transmitida pelo Secretariado e clique em **« Abrir o documento »**. A chave não é guardada nem transmitida: é utilizada apenas no seu navegador, durante a leitura. Se um documento codificado utilizar outro processo de cifragem, descarregue-o e abra-o com a ferramenta indicada pelo Secretariado." },
        { h2: "7.6. Formatos não apresentáveis" },
        { p: "Os ficheiros Excel, PowerPoint e Word 97-2003 (.doc) não são apresentados no leitor: uma mensagem convida-o(a) a descarregá-los para os abrir com o seu software habitual." },
        {
          table: {
            caption: "Atalhos de teclado do leitor",
            head: ["Tecla", "Ação"],
            widths: [32, 68],
            rows: [
              ["← / →", "Página anterior / página seguinte"],
              ["+ / −", "Ampliar / reduzir"],
              ["0", "Repor o zoom predefinido"],
              ["Ctrl + roda do rato", "Zoom progressivo"],
              ["Ctrl + F", "Pesquisar no documento"],
              ["Esc", "Fechar a pesquisa e, em seguida, o leitor"],
            ],
          },
        },
        { box: { kind: "info", title: "Ler ou descarregar?", text: "A leitura na plataforma é recomendada para consultar rapidamente um documento, nomeadamente em sessão ou num dispositivo partilhado: o documento não é guardado nos ficheiros do dispositivo. Descarregue o documento quando precisar de o conservar, anotar ou consultar sem ligação à Internet." } },
      ],
    },
    {
      title: "8. Reuniões estatutárias e fios de discussão",
      blocks: [
        { p: "A página **« Reuniões estatutárias »** apresenta o calendário das reuniões que lhe estão abertas: órgão estatutário, datas, local, estado (futura, em curso, concluída), descrição e número de documentos associados. Está reservada aos titulares de uma conta de participante." },
        { p: "Cada reunião dispõe de um fio de discussão aberto aos participantes e ao Secretariado. Clique no botão **« Discussão »** de uma reunião para o abrir:" },
        { figure: ["05-reunions-discussion.png", "Uma reunião estatutária com o respetivo fio de discussão aberto"] },
        {
          bullets: [
            ["Escrever", "introduza a sua mensagem no campo inferior e prima Enter ou clique no botão de envio (máximo de 2000 caracteres);"],
            ["Acompanhar", "as novas mensagens aparecem automaticamente, sem necessidade de recarregar a página;"],
            ["Eliminar", "pode eliminar as suas próprias mensagens; o Secretariado assegura a moderação do fio."],
          ],
        },
        { h2: "8.1. Adicionar uma reunião à sua conta" },
        { p: "A sua conta dá acesso à reunião a título da qual se inscreveu. Se receber os códigos de outra reunião, adicione-a ao seu espaço sem criar uma nova conta:" },
        {
          steps: [
            ["Abra a página « Reuniões estatutárias » e clique em **« Adicionar uma reunião »**."],
            ["Introduza o identificador de reunião e a palavra-passe de acesso recebidos."],
            ["Clique em **« Desbloquear o acesso »**.", "A reunião e os respetivos documentos aparecem de imediato no seu espaço."],
          ],
        },
        { figure: ["05b-ajouter-reunion.png", "O formulário « Adicionar uma reunião »"] },
        { box: { kind: "info", title: "Boas práticas", text: "O fio de discussão é um espaço de trabalho oficial entre delegados acreditados. Solicita-se que nele observe a cortesia habitual, se mantenha factual e não partilhe qualquer informação confidencial que não se destine ao conjunto dos participantes." } },
      ],
    },
    {
      title: "9. O seu perfil",
      blocks: [
        { p: "A página **« O meu perfil »** resume as informações da sua acreditação: endereço de e-mail, instituição, país representado, função, data de acreditação, estado e, se aplicável, a reunião a título da qual se inscreveu." },
        { figure: ["06-profil.png", "A página « O meu perfil »: informações da sua acreditação"] },
        { box: { kind: "info", title: "Atualização das suas informações", text: "Por razões de integridade dos dados oficiais, as informações de acreditação não podem ser alteradas diretamente. Para qualquer correção (função, instituição, endereço de e-mail) ou para a alteração da palavra-passe, dirija o seu pedido ao Secretariado da CEEAC." } },
      ],
    },
    {
      title: "10. Conforto de leitura e língua da interface",
      blocks: [
        { p: "Estão permanentemente disponíveis duas definições na barra de cabeçalho, incluindo na página de início de sessão:" },
        { figure: ["07-entete-outils.png", "As ferramentas do cabeçalho: tamanho do texto, línguas, perfil e fim de sessão", 620] },
        {
          bullets: [
            ["Tamanho do texto", "o botão A aumenta o texto de toda a plataforma em três níveis (A, A+, A++); a sua definição é conservada de uma visita para a outra;"],
            ["Língua da interface", "os botões com bandeiras (FR · EN · PT · ES) alteram de imediato a língua da interface, sem terminar a sessão. A língua dos documentos é escolhida separadamente, no momento da leitura ou do descarregamento."],
          ],
        },
      ],
    },
    {
      title: "11. O guia integrado",
      blocks: [
        { p: "Está disponível a qualquer momento na plataforma um guia resumido: ligação **« Guia do utilizador »** da página de início de sessão ou menu **« Guia »** do seu espaço. O guia resume os procedimentos essenciais e propõe, quando publicado pelo Secretariado, o presente guia completo para leitura ou descarregamento nas quatro línguas." },
        { figure: ["08-guide-integre.png", "O guia integrado na plataforma"] },
      ],
    },
    {
      title: "12. Mensagens de correio eletrónico da plataforma",
      blocks: [
        { p: "No final das reuniões, o Secretariado pode enviar aos participantes os relatórios e documentos oficiais por correio eletrónico. Estas mensagens podem conter:" },
        {
          bullets: [
            "**ligações diretas**, por língua, para os documentos publicados na plataforma — é necessário iniciar sessão na sua conta para os abrir;",
            "**documentos anexados** diretamente à mensagem.",
          ],
        },
        { box: { kind: "security", title: "Vigilância", text: "As mensagens oficiais provêm exclusivamente do endereço do Secretariado e remetem unicamente para o endereço oficial da plataforma. Em caso de dúvida quanto à autenticidade de uma mensagem, não clique em nenhuma ligação e comunique a situação ao Secretariado." } },
      ],
    },
    {
      title: "13. Segurança e confidencialidade",
      blocks: [
        {
          bullets: [
            "Nunca comunique a sua palavra-passe pessoal; o Secretariado nunca lha solicitará.",
            "Transmita os códigos de reunião apenas aos membros autorizados da sua delegação.",
            "Num posto partilhado, privilegie a leitura na plataforma em vez do descarregamento e termine a sessão no final da consulta.",
            "Conserve as chaves de leitura dos documentos codificados separadamente dos próprios documentos.",
            "Comunique sem demora ao Secretariado qualquer perda de códigos, acesso suspeito ou mensagem duvidosa.",
          ],
        },
      ],
    },
    {
      title: "14. Perguntas frequentes",
      blocks: [
        {
          table: {
            caption: "Situações frequentes e procedimento a seguir",
            head: ["Situação encontrada", "Procedimento a seguir"],
            widths: [38, 62],
            rows: [
              ["« Identificador ou palavra-passe de reunião incorretos »", "Verifique o identificador (formato CEEAC-XXXXXX) e a palavra-passe (formato XXXX-XXXX), incluindo os hífenes. Se a mensagem persistir, os acessos podem ter sido renovados: contacte o seu ponto focal nacional ou o Secretariado."],
              ["Mensagem a indicar que o acesso de convidado expirou", "O acesso de convidado é válido durante 24 horas: introduza novamente os códigos de reunião para o renovar."],
              ["« As inscrições para esta reunião estão encerradas »", "A reunião terminou: já não é possível criar uma conta, mas os respetivos documentos continuam consultáveis com os códigos de reunião (separador « Códigos de reunião »)."],
              ["« Já existe uma conta com este e-mail »", "Utilize o separador « Tenho uma conta » da página de início de sessão. Para aceder a uma nova reunião, utilize « Adicionar uma reunião » (secção 8.1)."],
              ["« Credenciais incorretas » ao iniciar sessão", "Verifique o endereço de e-mail e a palavra-passe (atenção às maiúsculas). Após várias tentativas sem êxito, aplica-se, por razões de segurança, um tempo de espera de 15 minutos."],
              ["« A sua conta está desativada »", "A sua acreditação foi suspensa. Contacte o Secretariado da CEEAC para conhecer os motivos e, se for caso disso, solicitar a sua reativação."],
              ["Mensagem a indicar que a sessão expirou", "A sua sessão expirou (7 dias) ou a sua palavra-passe foi entretanto reposta: inicie sessão novamente."],
              ["Um documento esperado não aparece", "O documento pode ainda não ter sido publicado ou pertencer a uma reunião que não lhe está aberta: adicione essa reunião com os respetivos códigos (secção 8.1). Lembre-se também de repor os filtros."],
              ["O leitor apresenta « Pré-visualização indisponível para este formato »", "O ficheiro está em formato Excel, PowerPoint ou Word 97-2003: descarregue-o para o abrir com o seu software habitual."],
              ["O leitor pede uma chave de leitura", "O documento está codificado: introduza a chave transmitida pelo Secretariado. Se não a tiver recebido, contacte o seu ponto focal."],
              ["O texto é demasiado pequeno no ecrã", "Utilize o botão A / A+ / A++ do cabeçalho ou, para os documentos, o zoom do leitor."],
              ["Palavra-passe esquecida", "Dirija um pedido de reposição ao Secretariado. Ser-lhe-á entregue uma palavra-passe provisória; definirá uma nova no início de sessão seguinte."],
            ],
          },
        },
      ],
    },
    {
      title: "15. Assistência",
      blocks: [
        { p: "Para qualquer dificuldade de acesso, pedido de reposição da palavra-passe, correção das suas informações de acreditação ou questão relativa à plataforma, o Secretariado da CEEAC permanece à sua disposição:" },
        {
          bullets: [
            "por correio eletrónico, para o endereço de contacto indicado na página de início de sessão e no guia integrado;",
            "ou através do seu ponto focal nacional.",
          ],
        },
        { p: "A fim de facilitar o tratamento do seu pedido, queira indicar o seu nome completo, o seu país, a sua instituição, a reunião em causa e uma descrição precisa da dificuldade encontrada, acompanhada, se possível, da mensagem de erro apresentada." },
        { p: "O Secretariado agradece a sua colaboração e deseja-lhe uma excelente utilização da plataforma.", run: {} },
      ],
    },
  ],
};
