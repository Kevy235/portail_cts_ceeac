/**
 * Guía del usuario PDRS-CEEAC — contenido en español.
 * Sintaxis: **texto** = negrita. Las etiquetas entre «» reproducen exactamente
 * las de la interfaz (src/i18n/es.ts).
 */
export default {
  lang: "es",
  file: "Guide-Utilisateur-PDRS-CEEAC-ES.docx",
  meta: {
    locale: "es-ES",
    title: "Guía del usuario — PDRS-CEEAC",
    subject:
      "Guía del usuario del Portal Documental de las Reuniones Estatutarias de la CEEAC, dirigida a los delegados y expertos de los Estados miembros",
    header: "Guía del usuario · Espacio del participante",
    footer: "© 2026 CEEAC-ECCAS · Portal Documental de las Reuniones Estatutarias",
  },
  labels: {
    figure: "Figura",
    table: "Tabla",
    toc: "Índice",
    tocHint:
      "Si el índice no aparece, acepte la actualización de campos que Word propone al abrir el documento (o haga clic con el botón derecho › Actualizar campos).",
    page: "Página",
  },
  cover: {
    community: "Comunidad Económica de los Estados de África Central",
    secretariat: "Comisión de la CEEAC · Secretaría de las reuniones estatutarias",
    platform: "Portal Documental de las Reuniones Estatutarias de la CEEAC",
    title: "Guía del usuario",
    subtitle: "Espacio del participante y acceso de invitado",
    version: "Versión 3.0 — Octubre de 2026",
    audience: "Dirigida a los delegados y expertos acreditados de los Estados miembros",
  },
  sheet: {
    title: "Ficha del documento",
    rows: [
      ["Título", "Guía del usuario de la plataforma PDRS-CEEAC — Espacio del participante"],
      ["Versión", "3.0 — octubre de 2026"],
      ["Destinatarios", "Delegados, expertos y puntos focales de los Estados miembros; invitados que dispongan de los códigos de una reunión"],
      ["Idiomas", "Français · English · Português · Español"],
      ["Novedades de la versión 3.0", "Lector de documentos integrado (PDF y Word); acceso compartimentado por reunión; incorporación de una reunión mediante sus códigos; capturas de pantalla actualizadas"],
      ["Contacto", "Secretaría de la CEEAC — dirección indicada en la página de inicio de sesión de la plataforma"],
    ],
  },
  chapters: [
    {
      title: "1. Presentación de la plataforma",
      blocks: [
        { p: "El **PDRS-CEEAC** (Portal Documental de las Reuniones Estatutarias de la CEEAC) es la plataforma oficial de puesta a disposición de los documentos de las reuniones estatutarias de la Comunidad: Conferencia de Jefes de Estado y de Gobierno, Consejo de Ministros, Comité de Embajadores, Comités Técnicos Especializados y demás reuniones estatutarias." },
        { p: "Implementada por la Comisión de la CEEAC, ofrece a los delegados y expertos de los Estados miembros:" },
        {
          bullets: [
            "la **lectura en línea** de los documentos oficiales directamente en la plataforma, gracias al lector integrado, sin descarga ni programas adicionales;",
            "la **descarga** de cada documento en los idiomas de la Comunidad disponibles — francés, inglés, portugués y español;",
            "el seguimiento del **calendario de las reuniones estatutarias** y los **hilos de debate** propios de cada reunión;",
            "la recepción, por correo electrónico, de los informes y documentos difundidos por la Secretaría.",
          ],
        },
        { p: "Los documentos son accesibles **antes, durante y después** de cada reunión. Cada acceso está **compartimentado**: los códigos de una reunión solo dan acceso a los documentos de dicha reunión." },
        { box: { kind: "info", title: "Conviene saber", text: "La plataforma funciona en cualquier navegador reciente (Chrome, Edge, Firefox, Safari), desde un ordenador, una tableta o un teléfono. No requiere ninguna instalación. La dirección de la plataforma le será comunicada por la Secretaría de la CEEAC o por su punto focal nacional." } },
      ],
    },
    {
      title: "2. Modalidades de acceso",
      blocks: [
        { p: "Con antelación a cada reunión estatutaria, la Secretaría transmite a los Estados miembros dos códigos de acceso: un **identificador de reunión** (con el formato CEEAC-XXXXXX) y una **contraseña de acceso** (con el formato XXXX-XXXX). Estos códigos abren dos niveles de acceso:" },
        {
          bullets: [
            ["Acceso de invitado", "usted introduce los códigos de reunión en la página de inicio de sesión y consulta de inmediato los documentos de la reunión, sin crear una cuenta (capítulo 3);"],
            ["Cuenta de participante", "si lo desea, usted crea su cuenta personal con los mismos códigos. Esta cuenta es necesaria para participar en los debates, recibir las difusiones por correo electrónico y agrupar varias reuniones en un mismo espacio (capítulo 4);"],
            ["Cuenta creada por la Secretaría", "en determinados casos, la Secretaría crea directamente su cuenta y le entrega una contraseña provisional, que deberá personalizar en su primer inicio de sesión (sección 5.1)."],
          ],
        },
        {
          table: {
            caption: "Funcionalidades disponibles según la modalidad de acceso",
            head: ["Funcionalidad", "Invitado (códigos de reunión)", "Participante (cuenta)"],
            widths: [50, 25, 25],
            center: [1, 2],
            rows: [
              ["Leer los documentos en el lector integrado", "Sí", "Sí"],
              ["Descargar los documentos (todos los idiomas disponibles)", "Sí", "Sí"],
              ["Buscar y filtrar en la biblioteca", "Sí", "Sí"],
              ["Reuniones accesibles", "La reunión correspondiente a los códigos introducidos", "Todas las reuniones abiertas a la cuenta"],
              ["Consultar el calendario de las reuniones estatutarias", "—", "Sí"],
              ["Participar en los hilos de debate", "—", "Sí"],
              ["Recibir los informes difundidos por correo electrónico", "—", "Sí"],
              ["Duración del acceso", "24 horas, renovable", "Permanente"],
            ],
          },
        },
      ],
    },
    {
      title: "3. Acceder a los documentos con los códigos de reunión (invitado)",
      blocks: [
        { p: "Esta es la vía más directa: no requiere crear ninguna cuenta y resulta idónea para consultar los documentos de una reunión." },
        {
          steps: [
            ["Abra la dirección de la plataforma en su navegador."],
            ["En la página de inicio de sesión, seleccione la pestaña **«Códigos de reunión»**."],
            ["Introduzca el **identificador de reunión** (CEEAC-XXXXXX) y la **contraseña de acceso** recibidos.", "Las mayúsculas se aplican automáticamente."],
            ["Haga clic en **«Acceder a los documentos»**.", "La biblioteca de la reunión se abre de inmediato."],
          ],
        },
        { figure: ["01b-connexion-codes.png", "La pestaña «Códigos de reunión» de la página de inicio de sesión"] },
        { p: "En calidad de invitado, usted puede leer y descargar libremente todos los documentos publicados para la reunión. Una banda informativa le recuerda su condición y le propone, en todo momento, crear su cuenta de participante." },
        { figure: ["03b-espace-invite.png", "El espacio documental con acceso de invitado y la banda informativa"] },
        { box: { kind: "warning", title: "Duración y renovación del acceso de invitado", text: "El acceso de invitado es válido durante 24 horas; basta con introducir de nuevo los códigos de reunión para renovarlo. Si la Secretaría renueva los accesos de una reunión, los códigos anteriores dejan de funcionar inmediatamente. Comunique los códigos únicamente a los miembros autorizados de su delegación." } },
      ],
    },
    {
      title: "4. Crear su cuenta de participante (opcional)",
      blocks: [
        { p: "No es necesario crear una cuenta personal para leer los documentos. En cambio, la cuenta da acceso a las funcionalidades de colaboración: hilos de debate de las reuniones, recepción de los informes difundidos por correo electrónico y agrupación de varias reuniones en su espacio. Los mismos códigos de reunión sirven para la inscripción." },
        {
          steps: [
            ["Abra la página de inscripción:", "enlace «Inscríbase aquí» de la página de inicio de sesión o enlace «Crear mi cuenta» del espacio de invitado."],
            ["En el apartado **«Accesos de la reunión»**, introduzca el identificador y la contraseña de reunión recibidos."],
            ["En el apartado **«Su información»**, indique su nombre completo, su dirección de correo electrónico institucional y su país.", "El cargo y la institución son opcionales."],
            ["Elija su contraseña personal (8 caracteres como mínimo) y confírmela."],
            ["Haga clic en **«Crear mi cuenta»**.", "Su sesión se inicia de inmediato y se le dirige a la biblioteca documental."],
          ],
        },
        { figure: ["02-inscription.png", "La página de inscripción: accesos de la reunión y, a continuación, información personal"] },
        { box: { kind: "info", title: "Importante", text: ["Los códigos de reunión sirven únicamente para abrir el acceso. Una vez creada su cuenta, usted inicia sesión siempre con **su dirección de correo electrónico y su contraseña personal**.", "Las inscripciones se cierran cuando una reunión ha finalizado; no obstante, sus documentos siguen pudiendo consultarse con los códigos de reunión."] } },
      ],
    },
    {
      title: "5. Iniciar sesión con su cuenta",
      blocks: [
        {
          steps: [
            ["Abra la dirección de la plataforma en su navegador."],
            ["En la pestaña **«Tengo una cuenta»**, introduzca su dirección de correo electrónico y su contraseña."],
            ["Haga clic en **«Iniciar sesión»**."],
          ],
        },
        { figure: ["01-connexion.png", "La página de inicio de sesión — pestaña «Tengo una cuenta»"] },
        { p: "Su sesión de trabajo permanece activa durante 7 días en el dispositivo utilizado. Para cerrar la sesión, haga clic en el icono de cierre de sesión situado en la parte superior derecha de la pantalla, en particular si utiliza un equipo compartido." },
        { h2: "5.1. Primer inicio de sesión con una contraseña provisional" },
        { p: "Si su cuenta ha sido creada por la Secretaría, se le habrá entregado una contraseña provisional. En su primer inicio de sesión, la plataforma le invita a definir su contraseña personal:" },
        {
          steps: [
            ["Inicie sesión con su dirección de correo electrónico y la contraseña provisional recibida."],
            ["Introduzca la contraseña provisional y, a continuación, su nueva contraseña (8 caracteres como mínimo) y su confirmación."],
            ["Haga clic en **«Definir mi contraseña»**.", "A continuación, accederá a su espacio."],
          ],
        },
        { figure: ["03-premiere-connexion.png", "La pantalla de primer inicio de sesión: definición de la contraseña personal"] },
        { box: { kind: "security", title: "Seguridad de su contraseña", text: "Elija una contraseña robusta y personal (letras, cifras y caracteres especiales). Se conserva de forma cifrada: ni la Secretaría ni el administrador pueden consultarla. En caso de olvido, solicite su restablecimiento a la Secretaría de la CEEAC." } },
      ],
    },
    {
      title: "6. La biblioteca documental",
      blocks: [
        { p: "La biblioteca es su página de inicio. Reúne los documentos oficiales publicados para las reuniones que le están abiertas, agrupados según el estado de la reunión (**reunión en curso**, **reuniones próximas**, **reuniones finalizadas** y, por último, **otros documentos**)." },
        { figure: ["04-bibliotheque.png", "La biblioteca documental: búsqueda, filtros, lectura y descarga por idioma"] },
        { h2: "6.1. Buscar y filtrar" },
        {
          bullets: [
            ["Búsqueda", "introduzca una o varias palabras del título o del nombre del archivo en el campo «Buscar un documento…»;"],
            ["Reunión", "el selector «Todas las reuniones» limita la visualización a los documentos de una reunión determinada;"],
            ["Categoría", "haga clic en una categoría (por ejemplo Rapport, Résolution, Ordre du Jour, Note Conceptuelle — denominaciones definidas por la Secretaría);"],
            ["Idioma", "los botones con banderas muestran únicamente los documentos disponibles en el idioma elegido;"],
            ["Restablecimiento", "el botón «Restablecer los filtros» restaura la visualización completa; el número de documentos correspondientes se indica a la derecha."],
          ],
        },
        { h2: "6.2. Leer o descargar un documento" },
        { p: "Para cada documento se proponen dos acciones por versión lingüística:" },
        {
          bullets: [
            ["Leer", "haga clic en el **título del documento** o en el botón con el **ojo**: el documento se abre en el lector integrado (capítulo 7);"],
            ["Descargar", "haga clic en el botón del idioma deseado (bandera y código FR, EN, PT, ES): el progreso se muestra en el propio botón y, a continuación, el archivo se guarda en su dispositivo."],
          ],
        },
        { p: "Solo se proponen los idiomas efectivamente disponibles para cada documento. La mención «Versión n» indica que la Secretaría ha actualizado un documento: la biblioteca muestra siempre la versión más reciente." },
        { h2: "6.3. Los documentos codificados" },
        { p: "Algunos documentos sensibles llevan la insignia roja **«Documento codificado»**: la Secretaría ha cifrado el archivo antes de publicarlo. Para abrirlo se necesita la **clave de lectura**, comunicada por separado a través de un canal seguro. Si no ha recibido dicha clave, diríjase a su punto focal o a la Secretaría de la CEEAC." },
      ],
    },
    {
      title: "7. Leer un documento en la plataforma",
      blocks: [
        { p: "El **lector integrado** muestra los documentos PDF y Word directamente en la plataforma, a pantalla completa, sin descarga ni programas adicionales. Se abre con un clic en el título de un documento o en el botón con el ojo; de forma predeterminada, presenta la versión en el idioma de la interfaz cuando existe." },
        { figure: ["04b-lecteur.png", "El lector integrado: encabezado del documento, versiones lingüísticas, descarga y barra de herramientas"] },
        { h2: "7.1. Composición del lector" },
        {
          bullets: [
            ["Encabezado", "título del documento, referencia de la reunión, nombre y tamaño del archivo e insignia «Codificado», en su caso;"],
            ["Versiones lingüísticas", "las banderas FR · EN · PT · ES permiten pasar de un idioma a otro sin cerrar el lector;"],
            ["Descargar", "el botón «Descargar» guarda en su dispositivo la versión mostrada;"],
            ["Barra de herramientas", "navegación por páginas, zoom, rotación, búsqueda y pantalla completa;"],
            ["Barra de estado", "número de páginas, nivel de zoom y recordatorio de los atajos de teclado."],
          ],
        },
        { h2: "7.2. Navegar y ajustar la visualización" },
        {
          table: {
            caption: "Comandos de la barra de herramientas del lector",
            head: ["Comando", "Efecto"],
            widths: [32, 68],
            rows: [
              ["Flechas ‹ y ›", "Página anterior / página siguiente."],
              ["Campo «n de N»", "Introduzca un número de página y pulse Intro para ir directamente a ella."],
              ["Lupas − y +", "Reducir / ampliar la visualización de forma escalonada (del 50 % al 300 %)."],
              ["Lista del zoom", "«Ajustar al ancho», «Página completa» o un porcentaje concreto."],
              ["Flecha circular", "Girar las páginas un cuarto de vuelta (documentos PDF)."],
              ["Lupa (a la derecha)", "Abrir la búsqueda en el documento."],
              ["Marco (a la derecha)", "Pasar a pantalla completa / salir de la pantalla completa."],
              ["Cruz (encabezado)", "Cerrar el lector y volver a la biblioteca."],
            ],
          },
        },
        { p: "También puede desplazarse por el documento con el ratón, el panel táctil o el dedo: el número de la página actual se actualiza automáticamente. El texto de los documentos PDF puede seleccionarse y copiarse." },
        { h2: "7.3. Buscar en el documento" },
        {
          steps: [
            ["Haga clic en la lupa de la barra de herramientas o pulse **Ctrl + F**."],
            ["Introduzca una palabra o una expresión y pulse **Intro**.", "La búsqueda no distingue entre mayúsculas y minúsculas ni tiene en cuenta los acentos."],
            ["El lector muestra la primera página correspondiente y resalta los pasajes. Pulse de nuevo Intro, o utilice las flechas ˄ ˅, para pasar de un resultado a otro."],
          ],
        },
        { figure: ["04c-lecteur-recherche.png", "Búsqueda de texto completo: resultado actual, número de resultados y pasajes resaltados"] },
        { h2: "7.4. Los documentos Word" },
        { p: "Los documentos Word recientes (formato .docx) se muestran con su formato: títulos, párrafos, tablas e imágenes. La búsqueda, el zoom y la descarga funcionan igual que para un PDF." },
        { figure: ["04d-lecteur-word.png", "Un documento Word mostrado en el lector integrado"] },
        { h2: "7.5. Documentos protegidos por una clave de lectura" },
        { p: "Cuando un documento codificado es un PDF protegido por contraseña, el lector muestra la pantalla **«Documento protegido por una clave de lectura»**. Introduzca la clave transmitida por la Secretaría y haga clic en **«Abrir el documento»**. La clave no se guarda ni se transmite: solo se utiliza en su navegador mientras dura la lectura. Si un documento codificado utiliza otro procedimiento de cifrado, descárguelo y ábralo con la herramienta indicada por la Secretaría." },
        { h2: "7.6. Formatos que no pueden mostrarse" },
        { p: "Los archivos Excel, PowerPoint y Word 97-2003 (.doc) no se muestran en el lector: un mensaje le invita a descargarlos para abrirlos con su programa habitual." },
        {
          table: {
            caption: "Atajos de teclado del lector",
            head: ["Tecla", "Acción"],
            widths: [32, 68],
            rows: [
              ["← / →", "Página anterior / página siguiente"],
              ["+ / −", "Ampliar / reducir"],
              ["0", "Volver al zoom predeterminado"],
              ["Ctrl + rueda del ratón", "Zoom progresivo"],
              ["Ctrl + F", "Buscar en el documento"],
              ["Esc", "Cerrar la búsqueda y, después, el lector"],
            ],
          },
        },
        { box: { kind: "info", title: "¿Lectura o descarga?", text: "Se recomienda la lectura en la plataforma para consultar rápidamente un documento, en particular durante las sesiones o en un dispositivo compartido: el documento no se guarda en los archivos del dispositivo. Descargue el documento cuando necesite conservarlo, anotarlo o consultarlo sin conexión." } },
      ],
    },
    {
      title: "8. Reuniones estatutarias e hilos de debate",
      blocks: [
        { p: "La página **«Reuniones estatutarias»** presenta el calendario de las reuniones que le están abiertas: órgano estatutario, fechas, lugar, estado (próxima, en curso, finalizada), descripción y número de documentos vinculados. Está reservada a los titulares de una cuenta de participante." },
        { p: "Cada reunión dispone de un hilo de debate abierto a los participantes y a la Secretaría. Haga clic en el botón **«Debate»** de una reunión para abrirlo:" },
        { figure: ["05-reunions-discussion.png", "Una reunión estatutaria con su hilo de debate abierto"] },
        {
          bullets: [
            ["Escribir", "introduzca su mensaje en el campo inferior y pulse Intro o haga clic en el botón de envío (2000 caracteres como máximo);"],
            ["Seguir", "los nuevos mensajes aparecen automáticamente, sin necesidad de recargar la página;"],
            ["Eliminar", "puede eliminar sus propios mensajes; la Secretaría se encarga de la moderación del hilo."],
          ],
        },
        { h2: "8.1. Añadir una reunión a su cuenta" },
        { p: "Su cuenta da acceso a la reunión en virtud de la cual usted se inscribió. Si recibe los códigos de otra reunión, añádala a su espacio sin crear una nueva cuenta:" },
        {
          steps: [
            ["Abra la página «Reuniones estatutarias» y haga clic en **«Añadir una reunión»**."],
            ["Introduzca el identificador de reunión y la contraseña de acceso recibidos."],
            ["Haga clic en **«Desbloquear el acceso»**.", "La reunión y sus documentos aparecen de inmediato en su espacio."],
          ],
        },
        { figure: ["05b-ajouter-reunion.png", "El formulario «Añadir una reunión»"] },
        { box: { kind: "info", title: "Buenas prácticas", text: "El hilo de debate es un espacio de trabajo oficial entre delegados acreditados. Le rogamos que observe en él la cortesía habitual, que se atenga a los hechos y que no comparta ninguna información confidencial que no esté destinada al conjunto de los participantes." } },
      ],
    },
    {
      title: "9. Su perfil",
      blocks: [
        { p: "La página **«Mi perfil»** recoge la información de su acreditación: dirección de correo electrónico, institución, país representado, cargo, fecha de acreditación, estado y, en su caso, la reunión en virtud de la cual usted se inscribió." },
        { figure: ["06-profil.png", "La página «Mi perfil»: información de su acreditación"] },
        { box: { kind: "info", title: "Actualización de su información", text: "Para preservar la integridad de los datos oficiales, la información de acreditación no puede modificarse directamente. Para cualquier corrección (cargo, institución, dirección de correo electrónico) o para cambiar su contraseña, dirija su solicitud a la Secretaría de la CEEAC." } },
      ],
    },
    {
      title: "10. Comodidad de lectura e idioma de la interfaz",
      blocks: [
        { p: "En la barra de encabezado hay dos ajustes disponibles en todo momento, incluso en la página de inicio de sesión:" },
        { figure: ["07-entete-outils.png", "Las herramientas del encabezado: tamaño del texto, idiomas, perfil y cierre de sesión", 620] },
        {
          bullets: [
            ["Tamaño del texto", "el botón A amplía el texto de toda la plataforma en tres niveles (A, A+, A++); su ajuste se conserva de una visita a otra;"],
            ["Idioma de la interfaz", "los botones con banderas (FR · EN · PT · ES) cambian de inmediato el idioma de la interfaz, sin cerrar la sesión. El idioma de los documentos se elige por separado, en el momento de la lectura o de la descarga."],
          ],
        },
      ],
    },
    {
      title: "11. La guía integrada",
      blocks: [
        { p: "En la plataforma hay disponible en todo momento una guía abreviada: enlace **«Guía del usuario»** de la página de inicio de sesión, o menú **«Guía»** de su espacio. Resume los procedimientos esenciales y, cuando la Secretaría la ha publicado, ofrece la presente guía completa para su lectura o descarga en los cuatro idiomas." },
        { figure: ["08-guide-integre.png", "La guía integrada en la plataforma"] },
      ],
    },
    {
      title: "12. Los correos electrónicos de la plataforma",
      blocks: [
        { p: "Al término de las reuniones, la Secretaría puede enviar a los participantes los informes y documentos oficiales por correo electrónico. Estos mensajes pueden contener:" },
        {
          bullets: [
            "**enlaces directos**, por idioma, a los documentos publicados en la plataforma — para abrirlos es necesario iniciar sesión en su cuenta;",
            "**documentos adjuntos** directamente al mensaje.",
          ],
        },
        { box: { kind: "security", title: "Precaución", text: "Los correos oficiales proceden exclusivamente de la dirección de la Secretaría y remiten únicamente a la dirección oficial de la plataforma. En caso de duda sobre la autenticidad de un mensaje, absténgase de hacer clic y comuníquelo a la Secretaría." } },
      ],
    },
    {
      title: "13. Seguridad y confidencialidad",
      blocks: [
        {
          bullets: [
            "No comunique nunca su contraseña personal; la Secretaría nunca se la solicitará.",
            "Transmita los códigos de reunión únicamente a los miembros autorizados de su delegación.",
            "En un equipo compartido, dé preferencia a la lectura en la plataforma frente a la descarga y cierre la sesión al término de su consulta.",
            "Conserve las claves de lectura de los documentos codificados por separado de los propios documentos.",
            "Comunique sin demora a la Secretaría cualquier pérdida de códigos, acceso sospechoso o mensaje dudoso.",
          ],
        },
      ],
    },
    {
      title: "14. Preguntas frecuentes",
      blocks: [
        {
          table: {
            caption: "Situaciones frecuentes y procedimiento que debe seguirse",
            head: ["Situación", "Procedimiento"],
            widths: [38, 62],
            rows: [
              ["«Identificador o contraseña de reunión incorrectos»", "Compruebe el identificador (formato CEEAC-XXXXXX) y la contraseña (formato XXXX-XXXX), guiones incluidos. Si el mensaje persiste, es posible que los accesos se hayan renovado: diríjase a su punto focal nacional o a la Secretaría."],
              ["Mensaje que indica que el acceso de invitado ha caducado", "El acceso de invitado es válido durante 24 horas: introduzca de nuevo los códigos de reunión para renovarlo."],
              ["«Las inscripciones para esta reunión están cerradas»", "La reunión ha finalizado: ya no es posible crear una cuenta, pero sus documentos siguen pudiendo consultarse con los códigos de reunión (pestaña «Códigos de reunión»)."],
              ["«Ya existe una cuenta con este correo. Inicie sesión directamente.»", "Utilice la pestaña «Tengo una cuenta» de la página de inicio de sesión. Para acceder a una nueva reunión, utilice «Añadir una reunión» (sección 8.1)."],
              ["«Credenciales incorrectas. Inténtelo de nuevo.» al iniciar sesión", "Compruebe la dirección de correo electrónico y la contraseña (atención a las mayúsculas). Tras varios intentos fallidos, se aplica un tiempo de espera de 15 minutos por razones de seguridad."],
              ["«Su cuenta está desactivada. Contacte con la Secretaría de la CEEAC.»", "Su acreditación ha sido suspendida. Póngase en contacto con la Secretaría de la CEEAC para conocer los motivos y, en su caso, solicitar su reactivación."],
              ["Mensaje que indica que la sesión ha caducado y que debe volver a iniciar sesión", "Su sesión ha caducado (7 días) o su contraseña se ha restablecido entretanto: vuelva a iniciar sesión."],
              ["No aparece un documento esperado", "Es posible que todavía no se haya publicado o que corresponda a una reunión que no le está abierta: añada dicha reunión con sus códigos (sección 8.1). Recuerde también restablecer los filtros."],
              ["El lector muestra «Vista previa no disponible para este formato»", "El archivo está en formato Excel, PowerPoint o Word 97-2003: descárguelo para abrirlo con su programa habitual."],
              ["El lector solicita una clave de lectura", "El documento está codificado: introduzca la clave transmitida por la Secretaría. Si no la ha recibido, diríjase a su punto focal."],
              ["El texto es demasiado pequeño en pantalla", "Utilice el botón A / A+ / A++ del encabezado o, para los documentos, el zoom del lector."],
              ["Contraseña olvidada", "Dirija una solicitud de restablecimiento a la Secretaría. Se le entregará una contraseña provisional; definirá una nueva en su siguiente inicio de sesión."],
            ],
          },
        },
      ],
    },
    {
      title: "15. Asistencia",
      blocks: [
        { p: "Para cualquier dificultad de acceso, solicitud de restablecimiento de contraseña, corrección de su información de acreditación o pregunta relativa a la plataforma, la Secretaría de la CEEAC queda a su disposición:" },
        {
          bullets: [
            "por correo electrónico, en la dirección de contacto indicada en la página de inicio de sesión y en la guía integrada;",
            "o por mediación de su punto focal nacional.",
          ],
        },
        { p: "Para facilitar la tramitación de su solicitud, le rogamos que indique su nombre completo, su país, su institución, la reunión de que se trate y una descripción precisa de la dificultad encontrada, acompañada, si es posible, del mensaje de error mostrado." },
        { p: "La Secretaría le agradece su colaboración y le desea una excelente experiencia de uso de la plataforma.", run: {} },
      ],
    },
  ],
};
