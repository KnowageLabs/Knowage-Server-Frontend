/**
 * AI Tools Streaming Messages Configuration
 * Maps tool names to localized streaming messages shown while the tool is executing.
 * Messages are selected randomly from their respective arrays.
 */

export interface ToolStreamingMessagesConfig {
  [toolName: string]: {
    it_IT: string[]
    en_US: string[]
  }
}

export const AI_TOOLS_STREAMING_MESSAGES: ToolStreamingMessagesConfig = {
  list_skills: {
    it_IT: [
      'Sto valutando quali competenze ho a disposizione per la tua richiesta.',
      'Controllo le capacità disponibili per scegliere l\'approccio migliore.',
      'Analizzo gli strumenti a mia disposizione prima di procedere.',
      'Sto individuando la competenza più adatta a rispondere.',
      'Verifico quali capacità posso attivare per aiutarti.'
    ],
    en_US: [
      'Evaluating available skills to address your request.',
      'Checking capabilities to choose the best approach.',
      'Analyzing tools at my disposal before proceeding.',
      'Identifying the most suitable skill to respond.',
      'Verifying which abilities I can activate to help you.'
    ]
  },
  load_skill: {
    it_IT: [
      'Sto attivando la competenza necessaria per gestire la tua richiesta.',
      'Preparo gli strumenti specializzati per questa attività.',
      'Carico le istruzioni operative adatte al tuo caso.',
      'Mi sto predisponendo con la capacità giusta per procedere.',
      'Configuro l\'ambiente di lavoro più indicato per la tua domanda.'
    ],
    en_US: [
      'Activating the skill needed to handle your request.',
      'Preparing specialized tools for this task.',
      'Loading operational instructions suited to your case.',
      'Getting ready with the right capability to proceed.',
      'Configuring the work environment best suited for your question.'
    ]
  },
  load_skill_resource: {
    it_IT: [
      'Sto consultando le risorse di riferimento per questa operazione.',
      'Apro la documentazione interna utile a impostare il lavoro.',
      'Leggo i dettagli operativi necessari prima di agire.',
      'Recupero le informazioni di supporto per procedere correttamente.',
      'Verifico le indicazioni specifiche per questa attività.'
    ],
    en_US: [
      'Consulting reference resources for this operation.',
      'Opening internal documentation useful for setting up the work.',
      'Reading operational details needed before acting.',
      'Retrieving support information to proceed correctly.',
      'Verifying specific instructions for this task.'
    ]
  },
  run_skill_script: {
    it_IT: [
      'Sto eseguendo una procedura specializzata per completare il passaggio richiesto.',
      'Avvio l\'elaborazione automatica prevista per questa attività.',
      'Eseguo i passi tecnici necessari a produrre il risultato.',
      'Sto lanciando la routine di elaborazione dedicata.',
      'Procedo con l\'esecuzione dello step operativo richiesto.'
    ],
    en_US: [
      'Executing a specialized procedure to complete the requested step.',
      'Starting the automated processing planned for this task.',
      'Performing technical steps needed to produce the result.',
      'Launching the dedicated processing routine.',
      'Proceeding with execution of the requested operational step.'
    ]
  },
  write_todos: {
    it_IT: [
      'Sto organizzando un piano con i passaggi necessari.',
      'Definisco la sequenza di operazioni per rispondere al meglio.',
      'Struturo le attività da svolgere per la tua richiesta.',
      'Preparo una scaletta dei passi da seguire.',
      'Imposto il piano di lavoro prima di iniziare.'
    ],
    en_US: [
      'Organizing a plan with the necessary steps.',
      'Defining the sequence of operations to respond best.',
      'Structuring the tasks to perform for your request.',
      'Preparing a checklist of steps to follow.',
      'Setting up the work plan before starting.'
    ]
  },
  read_todos: {
    it_IT: [
      'Sto rivedendo il piano di lavoro in corso.',
      'Controllo a che punto sono nelle attività pianificate.',
      'Verifico i passaggi già previsti per questa richiesta.',
      'Riprendo la scaletta delle operazioni per orientarmi.',
      'Faccio il punto sulle attività da completare.'
    ],
    en_US: [
      'Reviewing the current work plan.',
      'Checking my progress through the planned tasks.',
      'Verifying steps already planned for this request.',
      'Resuming the checklist of operations to orient myself.',
      'Taking stock of the tasks to complete.'
    ]
  },
  update_todo: {
    it_IT: [
      'Sto aggiornando lo stato di avanzamento del piano.',
      'Segno questo passaggio e procedo con il prossimo.',
      'Aggiorno i progressi delle attività in corso.',
      'Tengo traccia di ciò che ho completato finora.',
      'Marco il passo corrente e continuo con il lavoro.'
    ],
    en_US: [
      'Updating the progress status of the plan.',
      'Marking this step and moving to the next.',
      'Updating progress on ongoing tasks.',
      'Keeping track of what I\'ve completed so far.',
      'Marking the current step and continuing with the work.'
    ]
  },
  list_session_files: {
    it_IT: [
      'Sto controllando i dati e i grafici già disponibili in questa sessione.',
      'Verifico se esistono già risultati utili a rispondere.',
      'Esamino i file prodotti finora per non rifare lavoro inutile.',
      'Controllo gli artefatti disponibili prima di procedere.',
      'Recupero l\'elenco dei dataset e dei grafici già creati.'
    ],
    en_US: [
      'Checking data and charts already available in this session.',
      'Verifying existing results that could help answer.',
      'Examining files produced so far to avoid redundant work.',
      'Checking available artifacts before proceeding.',
      'Retrieving the list of datasets and charts already created.'
    ]
  },
  read_csv: {
    it_IT: [
      'Sto esaminando il dataset per estrarre le informazioni richieste.',
      'Analizzo i dati già disponibili per rispondere alla tua domanda.',
      'Leggo struttura e statistiche del dataset per verificare i valori.',
      'Controllo il contenuto dei dati per fornirti una risposta accurata.',
      'Esploro le righe e le colonne del dataset selezionato.'
    ],
    en_US: [
      'Examining the dataset to extract requested information.',
      'Analyzing available data to answer your question.',
      'Reading dataset structure and statistics to verify values.',
      'Checking data content to provide you with an accurate answer.',
      'Exploring rows and columns of the selected dataset.'
    ]
  },
  read_layout_chart: {
    it_IT: [
      'Sto ispezionando la struttura del grafico esistente.',
      'Analizzo titolo, assi e serie del grafico per capire cosa contiene.',
      'Verifico la configurazione attuale della visualizzazione.',
      'Controllo i dettagli del grafico prima di intervenire.',
      'Esamino il layout del grafico per individuare cosa migliorare.'
    ],
    en_US: [
      'Inspecting the structure of the existing chart.',
      'Analyzing chart title, axes, and series to understand what it contains.',
      'Verifying the current visualization configuration.',
      'Checking chart details before making changes.',
      'Examining the chart layout to identify improvements.'
    ]
  },
  edit_layout_chart: {
    it_IT: [
      'Sto applicando le modifiche grafiche richieste alla visualizzazione.',
      'Aggiorno l\'aspetto del grafico mantenendo intatti i dati.',
      'Sto personalizzando titolo, assi e stile del grafico.',
      'Affino la visualizzazione secondo le tue indicazioni.',
      'Ritocco l\'impaginazione del grafico per renderlo più chiaro.'
    ],
    en_US: [
      'Applying requested graphic changes to the visualization.',
      'Updating the chart appearance while keeping data intact.',
      'Customizing chart title, axes, and style.',
      'Refining the visualization according to your directions.',
      'Adjusting the chart layout to make it clearer.'
    ]
  },
  sql_tool: {
    it_IT: [
      'Sto interrogando il database per recuperare i dati richiesti.',
      'Preparo ed eseguo la ricerca sui dati per rispondere alla tua domanda.',
      'Sto estraendo le informazioni dal database e validando i risultati.',
      'Recupero i dati aggiornati direttamente dalla fonte.',
      'Costruisco la query necessaria e raccolgo i risultati.'
    ],
    en_US: [
      'Querying the database to retrieve requested data.',
      'Preparing and running the search to answer your question.',
      'Extracting information from the database and validating results.',
      'Retrieving updated data directly from the source.',
      'Building the necessary query and collecting results.'
    ]
  },
  ml_tool: {
    it_IT: [
      'Sto eseguendo l\'analisi sui dati per ricavare i risultati richiesti.',
      'Elaboro il dataset con i calcoli statistici necessari.',
      'Sto generando la visualizzazione a partire dai dati.',
      'Applico il modello di analisi per rispondere alla tua domanda.',
      'Eseguo i calcoli e preparo i risultati dell\'analisi.'
    ],
    en_US: [
      'Running analysis on the data to derive requested results.',
      'Processing the dataset with necessary statistical calculations.',
      'Generating visualization from the data.',
      'Applying the analysis model to answer your question.',
      'Performing calculations and preparing analysis results.'
    ]
  },
  knowage_info_tool: {
    it_IT: [
      'Sto cercando le informazioni sulla piattaforma Knowage richieste.',
      'Consulto la documentazione delle dashboard e dei dataset disponibili.',
      'Recupero i dettagli su filtri, campi e dataset di Knowage.',
      'Sto interrogando la base di conoscenza di Knowage per rispondere.',
      'Verifico la struttura della piattaforma per darti la risposta giusta.'
    ],
    en_US: [
      'Searching for requested information on the Knowage platform.',
      'Consulting documentation of available dashboards and datasets.',
      'Retrieving details on Knowage filters, fields, and datasets.',
      'Querying the Knowage knowledge base to respond.',
      'Verifying platform structure to give you the right answer.'
    ]
  },
  knowage_activate_dashboard_tool: {
    it_IT: [
      'Sto preparando l\'attivazione della dashboard richiesta.',
      'Individuo la dashboard giusta e imposto i filtri indicati.',
      'Configuro i parametri della dashboard secondo la tua richiesta.',
      'Sto attivando la dashboard con i criteri specificati.',
      'Preparo la dashboard pronta da consultare con i filtri impostati.'
    ],
    en_US: [
      'Preparing to activate the requested dashboard.',
      'Finding the right dashboard and setting specified filters.',
      'Configuring dashboard parameters according to your request.',
      'Activating the dashboard with specified criteria.',
      'Preparing the dashboard ready to consult with filters set.'
    ]
  }
}

/**
 * Get a random streaming message for a given tool and locale.
 * Falls back to en_US if the locale is not available.
 * @param toolName - The name of the tool
 * @param locale - The locale code (e.g., 'it_IT', 'en_US')
 * @returns A random message from the tool's message array, or undefined if tool not found
 */
export function getRandomStreamingMessage(toolName: string, locale: string): string | undefined {
  const toolMessages = AI_TOOLS_STREAMING_MESSAGES[toolName]
  if (!toolMessages) return undefined

  const messages = toolMessages[locale as keyof typeof toolMessages] || toolMessages.en_US
  if (!Array.isArray(messages) || messages.length === 0) return undefined

  const randomIndex = Math.floor(Math.random() * messages.length)
  return messages[randomIndex]
}
